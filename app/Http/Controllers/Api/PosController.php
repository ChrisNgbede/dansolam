<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\Customer;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment as GatewayPayment;
use App\Models\PosCashMovement;
use App\Models\PosHeldCart;
use App\Models\PosHeldCartItem;
use App\Models\PosSession;
use App\Models\PosTransaction;
use App\Models\PosTransactionPayment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingRate;
use App\Models\Tax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosController extends Controller
{
    private function setting(array $settings, string $key, string $default): string
    {
        return (string) ($settings[$key] ?? $default);
    }

    public function getConfiguration()
    {
        $ecommerce = $this->getEcommerce();
        $settings = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->pluck('value', 'key')->all();
        $methods = collect(['cash', 'card', 'transfer'])->filter(function ($method) use ($settings) {
            return in_array($this->setting($settings, "payment_{$method}_channel", 'both'), ['pos', 'both'], true);
        })->values();

        return response()->json(['success' => true, 'data' => [
            'payment_methods' => $methods,
            'taxes' => Tax::where('is_active', true)->whereIn('sales_channel', ['pos', 'both'])->get(),
            'shipping_rates' => ShippingRate::where('is_active', true)->whereIn('sales_channel', ['pos', 'both'])->get(),
            'receipt_format' => in_array($this->setting($settings, 'pos_receipt_format', 'thermal'), ['thermal', 'a4'], true)
                ? $this->setting($settings, 'pos_receipt_format', 'thermal') : 'thermal',
            'receipt_footer' => $this->setting($settings, 'pos_receipt_footer', "THANK YOU FOR YOUR PATRONAGE!\nAll items checked out in-store are non-refundable after tags are removed."),
            'offline_enabled' => $this->setting($settings, 'pos_offline_enabled', 'true') === 'true',
            'auto_sync_enabled' => $this->setting($settings, 'pos_auto_sync_enabled', 'true') === 'true',
            'sync_interval' => max(10, (int) $this->setting($settings, 'pos_sync_interval', '30')),
        ]]);
    }

    /**
     * Get the active ecommerce helper.
     */
    private function getEcommerce()
    {
        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            abort(500, 'Ecommerce not registered');
        }
        return $ecommerce;
    }

    /**
     * Open a new register session.
     */
    public function openSession(Request $request)
    {
        $request->validate([
            'register_name' => 'required|string|max:255',
            'opening_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        // Check if there is already an open session for this user
        $existing = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an open register session.',
                'data' => $existing
            ], 400);
        }

        $session = PosSession::create([
            'user_id' => $user->id,
            'ecommerce_id' => $ecommerce->id,
            'register_name' => $request->register_name,
            'opening_cash' => $request->opening_cash,
            'expected_cash' => $request->opening_cash,
            'notes' => $request->notes,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Register session opened successfully.',
            'data' => $session
        ]);
    }

    /**
     * Fetch current open session.
     */
    public function getCurrentSession(Request $request)
    {
        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'No active register session found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $session
        ]);
    }

    /**
     * Close register session.
     */
    public function closeSession(Request $request)
    {
        $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'No open session found to close.'
            ], 404);
        }

        DB::transaction(function () use ($session, $request) {
            $session->closing_cash = $request->closing_cash;
            $session->notes = $session->notes . "\nClosing Notes: " . $request->notes;
            $session->status = 'closed';
            $session->closed_at = now();
            $session->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Session closed and reconciled successfully.',
            'data' => $session
        ]);
    }

    /**
     * Get register sessions history.
     */
    public function getSessionHistory(Request $request)
    {
        $ecommerce = $this->getEcommerce();
        $sessions = PosSession::where('ecommerce_id', $ecommerce->id)
            ->with('user')
            ->orderBy('id', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    /**
     * Search products by name, SKU, or barcode.
     */
    public function searchProducts(Request $request)
    {
        $query = $request->input('q');
        $ecommerce = $this->getEcommerce();

        $productsQuery = Product::where('ecommerce_id', $ecommerce->id)
            ->where('status', 'published')
            ->with(['variants', 'images', 'categories']);

        if (!empty($query)) {
            $productsQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere('slug', 'like', "%{$query}%")
                  ->orWhereHas('variants', function ($vQ) use ($query) {
                      $vQ->where('sku', 'like', "%{$query}%");
                  });
            });
        }

        $products = $productsQuery->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Search customers by name, email, or phone.
     */
    public function searchCustomers(Request $request)
    {
        $query = $request->input('q');

        $customersQuery = Customer::query();

        if (!empty($query)) {
            $customersQuery->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%");
            });
        }

        $customers = $customersQuery->limit(20)->get();

        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    /**
     * Inline customer creation.
     */
    public function quickAddCustomer(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => bcrypt(Str::random(16)), // Dummy password
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'data' => $customer
        ]);
    }

    /**
     * Create checkout sale / POS transaction.
     */
    public function createTransaction(Request $request)
    {
        $request->validate([
            'cart_items' => 'required|array|min:1',
            'cart_items.*.product_id' => 'required|exists:products,id',
            'cart_items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'cart_items.*.quantity' => 'required|integer|min:1',
            'cart_items.*.price' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'discount_amount' => 'required|numeric|min:0',
            'discount_type' => 'nullable|string',
            'discount_reason' => 'nullable|string',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_rate_id' => 'nullable|exists:shipping_rates,id',
            'notes' => 'nullable|string',
            'payments' => 'required|array|min:1',
            'payments.*.method' => 'required|string|in:cash,card,transfer',
            'payments.*.amount' => 'required|numeric|min:0',
            'payments.*.reference' => 'nullable|string',
            'payments.*.tendered' => 'nullable|numeric|min:0',
            'payments.*.change_due' => 'nullable|numeric|min:0',
            'offline_reference' => 'nullable|string|max:100',
        ]);

        if ($request->filled('offline_reference')) {
            $existing = PosTransaction::where('offline_reference', $request->offline_reference)->first();
            if ($existing) {
                return response()->json(['success' => true, 'message' => 'Offline sale was already synchronized.', 'data' => $existing->load(['payments', 'order.items'])]);
            }
        }

        $user = $request->user();
        $ecommerce = $this->getEcommerce();
        $settings = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->pluck('value', 'key')->all();
        $allowedMethods = collect(['cash', 'card', 'transfer'])->filter(fn ($method) =>
            in_array($this->setting($settings, "payment_{$method}_channel", 'both'), ['pos', 'both'], true)
        )->all();
        foreach ($request->payments as $payment) {
            if (!in_array($payment['method'], $allowedMethods, true)) {
                return response()->json(['success' => false, 'message' => ucfirst($payment['method']).' payments are not enabled for POS.'], 422);
            }
        }

        // Check if there is an active session
        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have an open register session. Please open one first.'
            ], 400);
        }

        $customer = null;
        if ($request->customer_id) {
            $customer = Customer::find($request->customer_id);
        }

        $transaction = DB::transaction(function () use ($request, $session, $user, $ecommerce, $customer) {
            $subtotal = 0;
            $itemsCount = 0;

            // Pre-calculate subtotal
            foreach ($request->cart_items as $item) {
                $subtotal += $item['price'] * $item['quantity'];
                $itemsCount += $item['quantity'];
            }

            $taxableAmount = max(0, $subtotal - $request->discount_amount);
            $taxes = Tax::where('is_active', true)->whereIn('sales_channel', ['pos', 'both'])->get();
            $taxAmount = $taxes->sum(function ($tax) use ($taxableAmount) {
                    return $tax->type === 'inclusive'
                        ? round($taxableAmount - ($taxableAmount / (1 + ($tax->rate / 100))), 2)
                        : round(($tax->rate / 100) * $taxableAmount, 2);
                });
            $addedTaxAmount = $taxes->where('type', 'exclusive')->sum(fn ($tax) => round(($tax->rate / 100) * $taxableAmount, 2));
            $shippingRate = $request->shipping_rate_id
                ? ShippingRate::whereKey($request->shipping_rate_id)->where('is_active', true)->whereIn('sales_channel', ['pos', 'both'])->first()
                : null;
            $shippingAmount = $shippingRate ? ($shippingRate->type === 'per_item' ? $shippingRate->rate * $itemsCount : $shippingRate->rate) : 0;
            $totalAmount = $subtotal - $request->discount_amount + $addedTaxAmount + $shippingAmount;
            if ($totalAmount < 0) {
                $totalAmount = 0;
            }

            // Generate unique Order and Transaction IDs
            $orderNumber = 'ORD-POS-' . strtoupper(Str::random(8));
            $transactionNumber = 'POS-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // 1. Create Laravel E-commerce Order
            $order = Order::create([
                'ecommerce_id' => $ecommerce->id,
                'customer_id' => $customer ? $customer->id : null,
                'order_number' => $orderNumber,
                'customer_name' => $customer ? $customer->name : 'Walk-in Customer',
                'customer_email' => $customer ? $customer->email : 'walkin@fairqueen.com',
                'customer_phone' => $customer ? $customer->phone : '0000000000',
                'delivery_address' => 'In-Store POS Checkout',
                'delivery_city' => 'In-Store',
                'delivery_state' => 'In-Store',
                'delivery_country' => 'Nigeria',
                'subtotal' => $subtotal,
                'discount_amount' => $request->discount_amount,
                'delivery_fee' => $shippingAmount,
                'total_amount' => $totalAmount,
                'payment_method' => 'POS Checkout',
                'payment_status' => 'paid',
                'order_status' => 'delivered',
                'delivery_method' => $shippingRate ? 'delivery' : 'pickup',
                'notes' => $request->notes,
                'paid_at' => now(),
                'delivered_at' => now(),
                'tax_amount' => $taxAmount,
            ]);

            // 2. Add Order Items & Adjust Inventory
            foreach ($request->cart_items as $item) {
                $product = Product::find($item['product_id']);
                $variant = $item['product_variant_id'] ? ProductVariant::find($item['product_variant_id']) : null;

                $variantLabel = null;
                if ($variant) {
                    $variantLabel = '';
                    if ($variant->size) $variantLabel .= "Size: {$variant->size} ";
                    if ($variant->color) $variantLabel .= "Color: {$variant->color}";
                    $variantLabel = trim($variantLabel);
                }

                // Create Order Item record
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variant ? $variant->id : null,
                    'product_name' => $product->name,
                    'variant_label' => $variantLabel,
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                ]);

                // Inventory Update
                if ($variant) {
                    $oldQty = $variant->stock_quantity;
                    $newQty = $oldQty - $item['quantity'];
                    $variant->stock_quantity = max(0, $newQty);
                    $variant->save();

                    InventoryLog::create([
                        'product_id' => $product->id,
                        'product_variant_id' => $variant->id,
                        'old_quantity' => $oldQty,
                        'new_quantity' => max(0, $newQty),
                        'change_amount' => -$item['quantity'],
                        'reason' => 'offline_sale',
                        'user_id' => $user->id,
                    ]);
                } else {
                    $oldQty = $product->stock_quantity;
                    $newQty = $oldQty - $item['quantity'];
                    $product->stock_quantity = max(0, $newQty);
                    $product->save();

                    InventoryLog::create([
                        'product_id' => $product->id,
                        'product_variant_id' => null,
                        'old_quantity' => $oldQty,
                        'new_quantity' => max(0, $newQty),
                        'change_amount' => -$item['quantity'],
                        'reason' => 'offline_sale',
                        'user_id' => $user->id,
                    ]);
                }
            }

            // 3. Create core gateway payment records
            foreach ($request->payments as $paymentData) {
                GatewayPayment::create([
                    'order_id' => $order->id,
                    'transaction_reference' => $paymentData['reference'] ?? ('PAY-POS-' . strtoupper(Str::random(10))),
                    'gateway' => 'pos_' . $paymentData['method'],
                    'amount' => $paymentData['amount'],
                    'status' => 'success',
                ]);
            }

            // 4. Create POS Transaction
            $posTransaction = PosTransaction::create([
                'session_id' => $session->id,
                'order_id' => $order->id,
                'user_id' => $user->id,
                'ecommerce_id' => $ecommerce->id,
                'customer_id' => $customer ? $customer->id : null,
                'transaction_number' => $transactionNumber,
                'offline_reference' => $request->offline_reference,
                'subtotal' => $subtotal,
                'discount_amount' => $request->discount_amount,
                'discount_type' => $request->discount_type,
                'discount_reason' => $request->discount_reason,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'payment_status' => 'paid',
                'notes' => $request->notes,
            ]);

            // 5. Add POS Transaction Payments & Update Session Running Totals
            foreach ($request->payments as $paymentData) {
                PosTransactionPayment::create([
                    'pos_transaction_id' => $posTransaction->id,
                    'method' => $paymentData['method'],
                    'amount' => $paymentData['amount'],
                    'reference' => $paymentData['reference'],
                    'tendered' => $paymentData['tendered'],
                    'change_due' => $paymentData['change_due'],
                ]);

                if ($paymentData['method'] === 'cash') {
                    $session->cash_sales_total += $paymentData['amount'];
                    $session->expected_cash += $paymentData['amount'];
                } elseif ($paymentData['method'] === 'card') {
                    $session->card_sales_total += $paymentData['amount'];
                } elseif ($paymentData['method'] === 'transfer') {
                    $session->transfer_sales_total += $paymentData['amount'];
                }
            }

            $session->total_sales += $totalAmount;
            $session->total_transactions += 1;
            $session->total_items_sold += $itemsCount;
            $session->save();

            return $posTransaction->load(['payments', 'order.items']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Sale checked out successfully.',
            'data' => $transaction
        ]);
    }

    /**
     * Get transactions list for the current session.
     */
    public function getTransactions(Request $request)
    {
        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        $query = PosTransaction::where('ecommerce_id', $ecommerce->id)
            ->with(['payments', 'customer', 'order.items']);

        if ($session) {
            $query->where('session_id', $session->id);
        } else {
            $query->orderBy('id', 'desc')->limit(50);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    /**
     * Get single transaction details.
     */
    public function getTransactionDetails($id)
    {
        $ecommerce = $this->getEcommerce();
        $transaction = PosTransaction::where('ecommerce_id', $ecommerce->id)
            ->with(['payments', 'customer', 'order.items'])
            ->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    }

    /**
     * Hold cart.
     */
    public function holdCart(Request $request)
    {
        $request->validate([
            'cart_items' => 'required|array|min:1',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'note' => 'nullable|string',
        ]);

        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'You need an open register session to park a cart.'
            ], 400);
        }

        $heldCart = DB::transaction(function () use ($request, $session, $user, $ecommerce) {
            $heldCart = PosHeldCart::create([
                'session_id' => $session->id,
                'user_id' => $user->id,
                'ecommerce_id' => $ecommerce->id,
                'customer_id' => $request->customer_id,
                'customer_name' => $request->customer_name,
                'note' => $request->note,
                'status' => 'held',
                'held_at' => now(),
            ]);

            foreach ($request->cart_items as $item) {
                PosHeldCartItem::create([
                    'pos_held_cart_id' => $heldCart->id,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'product_name' => $item['product_name'] ?? 'Unknown Product',
                    'variant_label' => $item['variant_label'] ?? null,
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return $heldCart->load('items');
        });

        return response()->json([
            'success' => true,
            'message' => 'Cart parked successfully.',
            'data' => $heldCart
        ]);
    }

    /**
     * Get held carts for current session.
     */
    public function getHeldCarts(Request $request)
    {
        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $carts = PosHeldCart::where('session_id', $session->id)
            ->where('status', 'held')
            ->with('items')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $carts
        ]);
    }

    /**
     * Resume a held cart.
     */
    public function resumeHeldCart($id)
    {
        $cart = PosHeldCart::with('items')->find($id);

        if (!$cart || $cart->status !== 'held') {
            return response()->json([
                'success' => false,
                'message' => 'Held cart not found or already resumed.'
            ], 404);
        }

        DB::transaction(function () use ($cart) {
            $cart->status = 'resumed';
            $cart->resumed_at = now();
            $cart->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Cart resumed successfully.',
            'data' => $cart
        ]);
    }

    /**
     * Delete a held cart.
     */
    public function deleteHeldCart($id)
    {
        $cart = PosHeldCart::find($id);

        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Held cart not found.'
            ], 404);
        }

        $cart->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parked cart discarded.'
        ]);
    }

    /**
     * Add cash drawer movement (cash-in/cash-out float adjustment).
     */
    public function addCashMovement(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:cash_in,cash_out',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'You need an open register session to record cash movements.'
            ], 400);
        }

        $movement = DB::transaction(function () use ($request, $session, $user) {
            $mov = PosCashMovement::create([
                'session_id' => $session->id,
                'user_id' => $user->id,
                'type' => $request->type,
                'amount' => $request->amount,
                'reason' => $request->reason,
            ]);

            if ($request->type === 'cash_in') {
                $session->expected_cash += $request->amount;
            } else {
                $session->expected_cash -= $request->amount;
            }
            $session->save();

            return $mov;
        });

        return response()->json([
            'success' => true,
            'message' => 'Cash movement recorded successfully.',
            'data' => $movement
        ]);
    }

    /**
     * Get cash movements list.
     */
    public function getCashMovements(Request $request)
    {
        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $movements = PosCashMovement::where('session_id', $session->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $movements
        ]);
    }

    /**
     * Fetch daily summary details for register.
     */
    public function getDailySummary(Request $request)
    {
        $user = $request->user();
        $ecommerce = $this->getEcommerce();

        $session = PosSession::where('user_id', $user->id)
            ->where('ecommerce_id', $ecommerce->id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'No active register session found.'
            ], 404);
        }

        $summary = [
            'session' => $session,
            'cash_movements' => PosCashMovement::where('session_id', $session->id)->get(),
            'sales_by_payment_method' => [
                'cash' => $session->cash_sales_total,
                'card' => $session->card_sales_total,
                'transfer' => $session->transfer_sales_total,
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }
}
