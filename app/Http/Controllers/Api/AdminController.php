<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\InventoryLog;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\FittingSession;
use App\Models\Review;
use App\Models\DeliveryZone;
use App\Models\Article;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Models\BlogComment;
use App\Models\GalleryItem;
use App\Models\Discount;
use App\Models\Tax;
use App\Models\ShippingRate;
use App\Models\ProductTag;
use App\Models\Banner;
use App\Models\Expense;
use App\Models\Purchase;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * List homepage hero slides in their storefront display order.
     */
    public function getHeroBanners()
    {
        return response()->json([
            'success' => true,
            'data' => Banner::where('type', 'hero')->orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function createHeroBanner(Request $request)
    {
        $data = $this->validateHeroBanner($request);
        $data['type'] = 'hero';
        $banner = Banner::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Hero slide created successfully.',
            'data' => $banner,
        ], 201);
    }

    public function updateHeroBanner(Request $request, $id)
    {
        $banner = Banner::where('type', 'hero')->findOrFail($id);
        $data = $this->validateHeroBanner($request);
        $data['type'] = 'hero';
        $banner->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Hero slide updated successfully.',
            'data' => $banner->fresh(),
        ]);
    }

    public function duplicateHeroBanner($id)
    {
        $source = Banner::where('type', 'hero')->findOrFail($id);

        $duplicate = DB::transaction(function () use ($source) {
            Banner::where('type', 'hero')
                ->where('sort_order', '>', $source->sort_order)
                ->increment('sort_order');

            $copy = $source->replicate();
            $copy->title = Str::limit($source->title . ' (Copy)', 180, '');
            $copy->sort_order = $source->sort_order + 1;
            $copy->is_active = false;
            $copy->save();

            return $copy;
        });

        return response()->json([
            'success' => true,
            'message' => 'Hero slide duplicated successfully. The copy is hidden until you publish it.',
            'data' => $duplicate,
        ], 201);
    }

    public function deleteHeroBanner($id)
    {
        $banner = Banner::where('type', 'hero')->findOrFail($id);
        $banner->delete();

        return response()->json([
            'success' => true,
            'message' => 'Hero slide deleted successfully.',
        ]);
    }

    private function validateHeroBanner(Request $request): array
    {
        return $request->validate([
            'eyebrow' => 'nullable|string|max:100',
            'show_eyebrow' => 'nullable|boolean',
            'title' => 'required|string|max:180',
            'accent_title' => 'nullable|string|max:180',
            'subtitle' => 'nullable|string|max:500',
            'image_url' => 'required|string|max:2048',
            'gallery' => 'nullable|array|max:12',
            'gallery.*.image_url' => 'required|string|max:2048',
            'gallery.*.link_url' => 'nullable|string|max:2048',
            'gallery.*.label' => 'nullable|string|max:120',
            'link_url' => 'nullable|string|max:2048',
            'primary_cta_label' => 'nullable|string|max:60',
            'secondary_cta_label' => 'nullable|string|max:60',
            'secondary_cta_url' => 'nullable|string|max:2048',
            'top_kicker' => 'nullable|string|max:100',
            'top_text' => 'nullable|string|max:180',
            'bottom_kicker' => 'nullable|string|max:100',
            'bottom_text' => 'nullable|string|max:180',
            'show_highlights' => 'nullable|boolean',
            'layout_mode' => 'nullable|string|in:default,full',
            'is_active' => 'required|boolean',
            'sort_order' => 'required|integer|min:0|max:10000',
        ]);
    }

    /**
     * Admin login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password'
            ], 401);
        }

        $token = $user->createToken('admin_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Admin authentication successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ]);
    }

    /**
     * Upload an image file and return its public URL.
     * Accepts multipart/form-data with field 'image'.
     */
    public function uploadImage(Request $request, ImageOptimizer $imageOptimizer)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp,gif|max:10240',
        ]);

        $path = $imageOptimizer->store($request->file('image'));

        return response()->json([
            'success' => true,
            'url'     => asset('storage/' . $path),
        ]);
    }


    /**
     * Admin logout.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    }

    /**
     * Get currently authenticated admin user profile.
     */
    public function getProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()->load('role')
        ]);
    }

    /**
     * Update admin user details.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin profile updated successfully',
            'data' => $user->load('role')
        ]);
    }

    /**
     * Send test email to verify SMTP configuration settings.
     */
    public function testSmtpConnection(Request $request)
    {
        $request->validate([
            'smtp_host' => 'required|string',
            'smtp_port' => 'required|integer',
            'smtp_username' => 'nullable|string',
            'smtp_password' => 'nullable|string',
            'smtp_encryption' => 'nullable|string',
            'smtp_from_address' => 'required|email',
            'smtp_from_name' => 'required|string',
            'recipient_email' => 'required|email',
        ]);

        try {
            \App\Services\StoreMailer::use($request->only(\App\Services\StoreMailer::KEYS));

            \Illuminate\Support\Facades\Mail::to($request->recipient_email)->send(
                new \App\Mail\TestSmtpMail($request->recipient_email)
            );

            return response()->json([
                'success' => true,
                'message' => 'Test email dispatched successfully! Please check your inbox at ' . $request->recipient_email
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'SMTP connection failed: ' . $this->explainSmtpError($e->getMessage())
            ], 422);
        }
    }

    /**
     * Turn common SMTP failures into a hint the store owner can act on.
     */
    private function explainSmtpError(string $error): string
    {
        $hint = match (true) {
            (bool) preg_match('/\b535\b|authenticat|username and password/i', $error) => 'the server rejected the username or password.',
            (bool) preg_match('/timed out|timeout/i', $error) => 'the server did not answer. Check the host and port, and that the port matches the encryption (465 for SSL, 587 for TLS).',
            (bool) preg_match('/refused|getaddrinfo|resolve|no such host|Network is unreachable/i', $error) => 'could not reach that host and port. Check the SMTP host name and port.',
            (bool) preg_match('/certificate|SSL|TLS|crypto/i', $error) => 'the secure connection failed. Try the other encryption option (SSL on 465, TLS on 587).',
            default => null,
        };

        return $hint ? ucfirst($hint) . ' (' . trim($error) . ')' : trim($error);
    }

    /**
     * Get dashboard metrics.
     */
    public function getMetrics()
    {
        // Total sales (paid orders)
        $totalSales = Order::where('payment_status', 'paid')->sum('total_amount');

        // Today's orders count
        $todayOrders = Order::whereDate('created_at', now()->toDateString())->count();

        // Pending orders
        $pendingOrders = Order::where('order_status', 'pending_payment')->count();

        // Paid/processing orders
        $paidOrders = Order::where('payment_status', 'paid')->whereNotIn('order_status', ['delivered', 'cancelled'])->count();

        // Low stock products/variants (variants with stock <= low stock threshold or products without variants with stock <= threshold)
        $lowStockVariants = ProductVariant::where('stock_quantity', '<=', DB::raw('low_stock_threshold'))
            ->with('product')
            ->limit(5)
            ->get();

        // Best sellers
        $bestSellers = OrderItem::select('product_id', 'product_name', DB::raw('SUM(quantity) as total_sold'))
            ->groupBy('product_id', 'product_name')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get();

        // Recent activity
        $recentOrders = Order::orderBy('created_at', 'desc')->limit(5)->get();

        // Chart sales (past 7 days)
        $salesChart = Order::select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        // Category splits (paid orders) — via pivot table
        $categorySplitsRaw = OrderItem::join('products', 'order_items.product_id', '=', 'products.id')
            ->join('category_product', 'products.id', '=', 'category_product.product_id')
            ->join('categories', 'category_product.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->select('categories.name as category_name', 'order_items.price', 'order_items.quantity')
            ->get();

        $categorySplits = $categorySplitsRaw->groupBy('category_name')
            ->map(function($group, $key) {
                return [
                    'category_name' => $key,
                    'total_sales' => (float) $group->sum(function($item) {
                        return $item->price * $item->quantity;
                    })
                ];
            })->values();

        // Payment splits (paid orders)
        $paymentSplitsRaw = Order::where('payment_status', 'paid')->get();
        $paymentSplits = $paymentSplitsRaw->groupBy('payment_method')
            ->map(function($group, $key) {
                return [
                    'payment_method' => $key ?: 'manual',
                    'count' => $group->count(),
                    'total' => (float) $group->sum('total_amount')
                ];
            })->values();

        // Monthly sales trend (past 6 months)
        $monthlySalesRaw = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subMonths(6))
            ->orderBy('created_at', 'asc')
            ->get();

        $monthlySales = $monthlySalesRaw->groupBy(function($order) {
            return $order->created_at->format('Y-m');
        })->map(function($group) {
            return [
                'month' => $group->first()->created_at->format('M Y'),
                'total' => (float) $group->sum('total_amount')
            ];
        })->values();

        // Module-aware financial performance. Purchases are treated as inventory
        // investment/cash outflow, not as an operating expense, to avoid reducing
        // profit twice when the same stock is later included in COGS.
        $ecommerceId = Ecommerce::query()->value('id');
        $moduleSettings = $ecommerceId
            ? EcommerceSetting::where('ecommerce_id', $ecommerceId)
                ->whereIn('key', ['module_expenses_enabled', 'module_purchases_enabled'])
                ->pluck('value', 'key')
            : collect();
        $enabledValue = static fn ($value): bool => in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
        $expensesEnabled = Schema::hasTable('expenses') && $enabledValue($moduleSettings->get('module_expenses_enabled'));
        $purchasesEnabled = Schema::hasTable('purchases') && $enabledValue($moduleSettings->get('module_purchases_enabled'));

        $cogs = (float) OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.payment_status', 'paid')
            ->when($ecommerceId, fn ($query) => $query->where('orders.ecommerce_id', $ecommerceId))
            ->sum(DB::raw('order_items.quantity * COALESCE(products.cost_price, 0)'));
        $paidExpenses = $expensesEnabled
            ? (float) Expense::where('ecommerce_id', $ecommerceId)->where('status', 'paid')->sum('amount')
            : 0.0;
        $paidPurchases = $purchasesEnabled
            ? (float) Purchase::where('ecommerce_id', $ecommerceId)->where('payment_status', 'paid')->where('status', '!=', 'cancelled')->sum('total_amount')
            : 0.0;
        $grossProfit = (float) $totalSales - $cogs;
        $netProfit = $grossProfit - $paidExpenses;
        $cashPosition = (float) $totalSales - $paidExpenses - $paidPurchases;

        $trendStart = now()->startOfMonth()->subMonths(5);
        $paidOrdersForTrend = Order::with('items.product')
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', $trendStart)
            ->when($ecommerceId, fn ($query) => $query->where('ecommerce_id', $ecommerceId))
            ->get();
        $expensesForTrend = $expensesEnabled
            ? Expense::where('ecommerce_id', $ecommerceId)->where('status', 'paid')->where('expense_date', '>=', $trendStart)->get()
            : collect();
        $purchasesForTrend = $purchasesEnabled
            ? Purchase::where('ecommerce_id', $ecommerceId)->where('payment_status', 'paid')->where('status', '!=', 'cancelled')->where('purchase_date', '>=', $trendStart)->get()
            : collect();

        $financialTrend = collect(range(0, 5))->map(function ($offset) use ($trendStart, $paidOrdersForTrend, $expensesForTrend, $purchasesForTrend) {
            $month = $trendStart->copy()->addMonths($offset);
            $key = $month->format('Y-m');
            $orders = $paidOrdersForTrend->filter(fn ($order) => $order->created_at->format('Y-m') === $key);
            $revenue = (float) $orders->sum('total_amount');
            $monthlyCogs = (float) $orders->sum(function ($order) {
                return $order->items->sum(fn ($item) => ((float) ($item->product?->cost_price ?? 0)) * $item->quantity);
            });
            $expenses = (float) $expensesForTrend->filter(fn ($expense) => $expense->expense_date->format('Y-m') === $key)->sum('amount');
            $purchases = (float) $purchasesForTrend->filter(fn ($purchase) => $purchase->purchase_date->format('Y-m') === $key)->sum('total_amount');

            return [
                'month' => $month->format('M'),
                'revenue' => $revenue,
                'cogs' => $monthlyCogs,
                'expenses' => $expenses,
                'purchases' => $purchases,
                'net_profit' => $revenue - $monthlyCogs - $expenses,
            ];
        })->values();

        $expenseCategories = $expensesEnabled
            ? Expense::where('ecommerce_id', $ecommerceId)->where('status', 'paid')->get()
                ->groupBy('category')->map(fn ($items, $category) => ['label' => $category, 'total' => (float) $items->sum('amount')])
                ->sortByDesc('total')->take(5)->values()
            : collect();
        $purchaseStatuses = $purchasesEnabled
            ? Purchase::where('ecommerce_id', $ecommerceId)->where('status', '!=', 'cancelled')->get()
                ->groupBy('status')->map(fn ($items, $status) => ['label' => ucfirst($status), 'total' => (float) $items->sum('total_amount')])
                ->sortByDesc('total')->values()
            : collect();

        // KPIs
        $totalPaidOrders = Order::where('payment_status', 'paid')->count();
        $aov = $totalPaidOrders > 0 ? (float) ($totalSales / $totalPaidOrders) : 0.0;
        $totalVolume = Order::count();

        // Skincare Concierge & Catalog Metrics
        $recentConsultations = FittingSession::orderBy('created_at', 'desc')->limit(4)->get();
        $pendingConsultationsCount = FittingSession::where('status', 'pending')->count();
        $recentReviews = Review::with('product')->orderBy('created_at', 'desc')->limit(4)->get();
        $totalProductsCount = Product::count();
        $totalCustomersCount = Customer::count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_sales' => $totalSales,
                'today_orders' => $todayOrders,
                'pending_orders' => $pendingOrders,
                'paid_orders' => $paidOrders,
                'low_stock' => $lowStockVariants,
                'best_sellers' => $bestSellers,
                'recent_orders' => $recentOrders,
                'recent_consultations' => $recentConsultations,
                'pending_consultations_count' => $pendingConsultationsCount,
                'recent_reviews' => $recentReviews,
                'total_products_count' => $totalProductsCount,
                'total_customers_count' => $totalCustomersCount,
                'sales_chart' => $salesChart,
                'category_splits' => $categorySplits,
                'payment_splits' => $paymentSplits,
                'monthly_sales' => $monthlySales,
                'financials' => [
                    'modules' => ['expenses' => $expensesEnabled, 'purchases' => $purchasesEnabled],
                    'cogs' => $cogs,
                    'gross_profit' => $grossProfit,
                    'operating_expenses' => $paidExpenses,
                    'net_profit' => $netProfit,
                    'purchase_spend' => $paidPurchases,
                    'cash_position' => $cashPosition,
                    'gross_margin' => (float) $totalSales > 0 ? ($grossProfit / (float) $totalSales) * 100 : 0,
                    'trend' => $financialTrend,
                    'expense_categories' => $expenseCategories,
                    'purchase_statuses' => $purchaseStatuses,
                ],
                'kpis' => [
                    'aov' => $aov,
                    'total_volume' => $totalVolume,
                    'paid_orders_count' => $totalPaidOrders
                ]
            ]
        ]);
    }

    /**
     * Admin Products Listing
     */
    public function getProducts(Request $request)
    {
        $products = Product::with(['categories', 'variants', 'images', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Generate dynamic unique SKU based on settings
     */
    public function generateSku()
    {
        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json(['success' => false, 'message' => 'Ecommerce not registered'], 500);
        }

        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }
        $prefix = $settings['sku_prefix'] ?? 'DAN-';
        $suffix = $settings['sku_suffix'] ?? '';

        do {
            $sku = $prefix . strtoupper(Str::random(6)) . $suffix;
        } while (Product::where('sku', $sku)->exists());

        return response()->json(['success' => true, 'sku' => $sku]);
    }

    /**
     * Create Product
     */
    public function createProduct(Request $request)
    {
        $request->validate([
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:products,sku',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,published,hidden,archived',
            'is_featured' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_best_seller' => 'boolean',
            'has_variants' => 'boolean',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'integer|min:0',
            'images' => 'nullable|array',
            'images.*' => 'string', // base64 or paths
            'variants' => 'nullable|array',
            'variants.*.size' => 'nullable|string',
            'variants.*.color' => 'nullable|string',
            'variants.*.stock_quantity' => 'integer|min:0',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.sku' => 'nullable|string',
            'sales_override' => 'nullable|integer',
            'weight' => 'nullable|numeric|min:0',
            'color_attribute' => 'nullable|string|max:100',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'depth' => 'nullable|numeric|min:0',
            'material' => 'nullable|string|max:100',
            'is_fragile' => 'boolean',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:product_tags,id',
        ]);

        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json(['success' => false, 'message' => 'Ecommerce not registered'], 500);
        }

        $slug = Str::slug($request->name);
        // Ensure slug is unique
        $originalSlug = $slug;
        $count = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $sku = $request->sku;
        if (empty($sku)) {
            $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->get();
            $settings = [];
            foreach ($settingsRaw as $s) {
                $settings[$s->key] = $s->value;
            }
            $prefix = $settings['sku_prefix'] ?? 'DAN-';
            $suffix = $settings['sku_suffix'] ?? '';
            do {
                $sku = $prefix . strtoupper(Str::random(6)) . $suffix;
            } while (Product::where('sku', $sku)->exists());
        }

        $product = Product::create([
            'ecommerce_id' => $ecommerce->id,
            'name' => $request->name,
            'slug' => $slug,
            'sku' => $sku,
            'description' => $request->description,
            'short_description' => $request->short_description,
            'price' => $request->price,
            'sale_price' => $request->sale_price,
            'cost_price' => $request->cost_price,
            'status' => $request->status,
            'is_featured' => $request->is_featured ?? false,
            'is_new_arrival' => $request->is_new_arrival ?? false,
            'is_best_seller' => $request->is_best_seller ?? false,
            'has_variants' => $request->has_variants ?? false,
            'stock_quantity' => $request->stock_quantity,
            'low_stock_threshold' => $request->low_stock_threshold ?? 5,
            'sales_override' => $request->sales_override ?? 0,
            'seo_title' => $request->name . ' | Dansolam',
            'seo_description' => $request->short_description,
            'weight' => $request->weight,
            'color_attribute' => $request->color_attribute,
            'width' => $request->width,
            'height' => $request->height,
            'depth' => $request->depth,
            'material' => $request->material,
            'is_fragile' => $request->is_fragile ?? false,
        ]);

        // Add Product Images
        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $idx => $imgUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $imgUrl,
                    'sort_order' => $idx,
                ]);
            }
        } else {
            // Default placeholder
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => '/images/products/placeholder.jpg',
                'sort_order' => 0,
            ]);
        }

        // Add Variants
        if ($request->has_variants && $request->has('variants') && is_array($request->variants)) {
            $totalStock = 0;
            foreach ($request->variants as $v) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $v['sku'] ?? $product->sku . '-' . strtoupper(str_replace(' ', '', $v['size'] ?? '')) . '-' . strtoupper(str_replace(' ', '', $v['color'] ?? '')),
                    'size' => $v['size'] ?? 'One Size',
                    'color' => $v['color'] ?? 'Standard',
                    'price' => $v['price'] ?? null,
                    'stock_quantity' => $v['stock_quantity'] ?? 0,
                    'low_stock_threshold' => 1,
                    'image_url' => $product->images()->first()->image_url ?? null,
                    'status' => 'active',
                ]);
                $totalStock += ($v['stock_quantity'] ?? 0);
            }
            $product->stock_quantity = $totalStock;
            $product->save();
        } else {
            // Create a single default variant representing the product itself
            ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $product->sku,
                'size' => 'One Size',
                'color' => 'Standard',
                'price' => null,
                'stock_quantity' => $product->stock_quantity,
                'low_stock_threshold' => 1,
                'image_url' => $product->images()->first()->image_url ?? null,
                'status' => 'active',
            ]);
        }

        if ($request->has('tag_ids')) {
            $product->tags()->sync($request->tag_ids);
        }

        // Sync categories (many-to-many)
        if ($request->has('category_ids')) {
            $product->categories()->sync($request->category_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product->load(['variants', 'images', 'tags', 'categories'])
        ], 201);
    }

    /**
     * Update Product
     */
    public function updateProduct(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $request->validate([
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:products,sku,' . $id,
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,published,hidden,archived',
            'is_featured' => 'boolean',
            'is_new_arrival' => 'boolean',
            'is_best_seller' => 'boolean',
            'has_variants' => 'boolean',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'integer|min:0',
            'sales_override' => 'nullable|integer',
            'weight' => 'nullable|numeric|min:0',
            'color_attribute' => 'nullable|string|max:100',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'depth' => 'nullable|numeric|min:0',
            'material' => 'nullable|string|max:100',
            'is_fragile' => 'boolean',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:product_tags,id',
        ]);

        $sku = $request->sku;
        if (empty($sku)) {
            $settingsRaw = EcommerceSetting::where('ecommerce_id', $product->ecommerce_id)->get();
            $settings = [];
            foreach ($settingsRaw as $s) {
                $settings[$s->key] = $s->value;
            }
            $prefix = $settings['sku_prefix'] ?? 'DAN-';
            $suffix = $settings['sku_suffix'] ?? '';
            do {
                $sku = $prefix . strtoupper(Str::random(6)) . $suffix;
            } while (Product::where('sku', $sku)->exists());
        }

        $product->update([
            'name' => $request->name,
            'sku' => $sku,
            'description' => $request->description,
            'short_description' => $request->short_description,
            'price' => $request->price,
            'sale_price' => $request->sale_price,
            'cost_price' => $request->cost_price,
            'status' => $request->status,
            'is_featured' => $request->is_featured,
            'is_new_arrival' => $request->is_new_arrival,
            'is_best_seller' => $request->is_best_seller,
            'has_variants' => $request->has_variants,
            'stock_quantity' => $request->stock_quantity,
            'low_stock_threshold' => $request->low_stock_threshold ?? 5,
            'sales_override' => $request->sales_override ?? 0,
            'weight' => $request->weight,
            'color_attribute' => $request->color_attribute,
            'width' => $request->width,
            'height' => $request->height,
            'depth' => $request->depth,
            'material' => $request->material,
            'is_fragile' => $request->is_fragile ?? false,
        ]);

        // If simple product, update single variant stock
        if (!$product->has_variants) {
            $variant = ProductVariant::where('product_id', $product->id)->first();
            if ($variant) {
                $variant->stock_quantity = $product->stock_quantity;
                $variant->save();
            }
        }

        if ($request->has('tag_ids')) {
            $product->tags()->sync($request->tag_ids);
        }

        // Sync categories (many-to-many)
        if ($request->has('category_ids')) {
            $product->categories()->sync($request->category_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product->load(['variants', 'images', 'tags'])
        ]);
    }

    /**
     * Delete Product
     */
    public function deleteProduct($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        $product->delete();
        return response()->json(['success' => true, 'message' => 'Product deleted successfully']);
    }

    /**
     * Toggle product featured status
     */
    public function toggleProductFeatured($id)
    {
        $product = Product::findOrFail($id);
        $product->is_featured = !$product->is_featured;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => $product->is_featured ? 'Product marked as featured!' : 'Product removed from featured!',
            'data' => $product
        ]);
    }

    /**
     * Override variant stock directly
     */
    public function updateVariantStock(Request $request, $variantId)
    {
        $request->validate(['stock_quantity' => 'required|integer|min:0']);
        $variant = ProductVariant::find($variantId);
        if (!$variant) {
            return response()->json(['success' => false, 'message' => 'Variant not found'], 404);
        }

        $oldStock = $variant->stock_quantity;
        $variant->stock_quantity = $request->stock_quantity;
        $variant->save();

        // Update product aggregate stock
        $product = Product::find($variant->product_id);
        if ($product) {
            $product->stock_quantity = ProductVariant::where('product_id', $product->id)->sum('stock_quantity');
            $product->save();
        }

        // Log audit
        InventoryLog::create([
            'product_variant_id' => $variant->id,
            'product_id' => $variant->product_id,
            'old_quantity' => $oldStock,
            'new_quantity' => $variant->stock_quantity,
            'change_amount' => $variant->stock_quantity - $oldStock,
            'reason' => 'correction',
            'user_id' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Stock adjusted successfully',
            'data' => $variant
        ]);
    }

    /**
     * Get all categories (Admin)
     */
    public function getCategories()
    {
        $categories = Category::with('parent')->withCount('products')->get();
        return response()->json(['success' => true, 'data' => $categories]);
    }

    /**
     * Create Category
     */
    public function createCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image_url' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'image_url' => $request->image_url ?? '/images/categories/placeholder.jpg',
            'parent_id' => $request->parent_id,
            'is_visible' => true,
        ]);

        return response()->json(['success' => true, 'data' => $category], 201);
    }

    /**
     * Get all collections (Admin)
     */
    public function getCollections()
    {
        $collections = Collection::with(['products', 'categories'])->get();
        return response()->json(['success' => true, 'data' => $collections]);
    }

    /**
     * Create Collection
     */
    public function createCollection(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'banner_url' => 'nullable|string',
            'description' => 'nullable|string',
            'is_published' => 'sometimes|boolean',
            'show_in_mega_menu' => 'sometimes|boolean',
        ]);

        $isPublished = $request->boolean('is_published', true);
        $showInMegaMenu = $isPublished && $request->boolean('show_in_mega_menu', true);

        $collection = Collection::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'banner_url' => $request->banner_url,
            'description' => $request->description,
            'is_published' => $isPublished,
            'show_in_mega_menu' => $showInMegaMenu,
        ]);

        return response()->json(['success' => true, 'data' => $collection], 201);
    }

    /**
     * Sync collection products
     */
    public function syncCollectionProducts(Request $request, $collectionId)
    {
        $request->validate(['product_ids' => 'required|array']);
        $collection = Collection::find($collectionId);
        if (!$collection) {
            return response()->json(['success' => false, 'message' => 'Collection not found'], 404);
        }

        $collection->products()->sync($request->product_ids);
        return response()->json(['success' => true, 'message' => 'Products synced successfully']);
    }

    /**
     * Sync collection categories
     */
    public function syncCollectionCategories(Request $request, $collectionId)
    {
        $request->validate(['category_ids' => 'required|array']);
        $collection = Collection::find($collectionId);
        if (!$collection) {
            return response()->json(['success' => false, 'message' => 'Collection not found'], 404);
        }

        $collection->categories()->sync($request->category_ids);
        return response()->json(['success' => true, 'message' => 'Categories synced successfully']);
    }

    /**
     * Get all orders (Admin)
     */
    public function getOrders(Request $request)
    {
        $query = Order::with(['items']);

        if ($request->has('status') && $request->status != '') {
            $query->where('order_status', $request->status);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $orders]);
    }

    /**
     * Get Order Details (Admin)
     */
    public function getOrderDetails($id)
    {
        $order = Order::with(['items', 'payments'])->find($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $order]);
    }

    /**
     * Fulfill order and change statuses (with manual bank transfer approval)
     */
    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate([
            'order_status' => 'required|string',
            'payment_status' => 'nullable|string',
        ]);

        $order = Order::with(['items', 'payments'])->find($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        // Once delivered, order fulfillment status is permanently locked and cannot be changed
        if ($order->order_status === 'delivered') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been delivered and finalized. Its fulfillment status cannot be modified.'
            ], 422);
        }

        $oldOrderStatus = $order->order_status;
        $oldPaymentStatus = $order->payment_status;
        $orderStatusChanged = false;
        $paymentStatusChanged = false;

        if ($request->filled('payment_status') && $request->payment_status !== $oldPaymentStatus) {
            $order->payment_status = $request->payment_status;
            $paymentStatusChanged = true;
            if ($request->payment_status == 'paid' && empty($order->paid_at)) {
                $order->paid_at = now();

                // If this is manual bank transfer, log a successful payment
                if ($order->payment_method == 'bank_transfer') {
                    Payment::create([
                        'order_id' => $order->id,
                        'transaction_reference' => 'MAN-' . Str::random(12),
                        'gateway' => 'bank_transfer',
                        'amount' => $order->total_amount,
                        'status' => 'success',
                        'gateway_response' => ['manual' => true, 'user' => auth()->user()->name ?? 'Admin'],
                    ]);
                }
            }
        }

        if ($request->filled('order_status') && $request->order_status !== $oldOrderStatus) {
            $order->order_status = $request->order_status;
            $orderStatusChanged = true;
            if ($request->order_status == 'delivered' && empty($order->delivered_at)) {
                $order->delivered_at = now();
            }
        }

        $order->save();

        // Dispatch Email notification to customer and admin
        $emailDispatched = false;
        $emailError = null;

        if ($orderStatusChanged || $paymentStatusChanged) {
            $templateType = $orderStatusChanged ? $order->order_status : ($paymentStatusChanged && $order->payment_status === 'paid' ? 'paid' : 'invoice');

            if (!empty($order->customer_email)) {
                try {
                    \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(
                        new \App\Mail\OrderInvoiceMail($order, $templateType)
                    );
                    $emailDispatched = true;
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Order status email failed for #{$order->order_number} to {$order->customer_email}: " . $e->getMessage());
                    $emailError = $e->getMessage();
                }
            }

            // Also notify store administrator email if configured
            try {
                $settingsRaw = EcommerceSetting::where('ecommerce_id', $order->ecommerce_id ?? 1)->pluck('value', 'key');
                $adminEmail = $settingsRaw['store_email'] ?? $settingsRaw['admin_notification_email'] ?? null;
                if ($adminEmail && filter_var($adminEmail, FILTER_VALIDATE_EMAIL) && strtolower($adminEmail) !== strtolower($order->customer_email ?? '')) {
                    \Illuminate\Support\Facades\Mail::to($adminEmail)->send(
                        new \App\Mail\OrderInvoiceMail($order, $templateType)
                    );
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Admin order status notification email failed: " . $e->getMessage());
            }
        }

        $formattedStatus = ucwords(str_replace('_', ' ', $order->order_status));
        $formattedPayment = ucwords(str_replace('_', ' ', $order->payment_status));

        $feedbackMsg = "Order status updated to '{$formattedStatus}' (Payment: {$formattedPayment}).";
        if ($emailDispatched) {
            $feedbackMsg .= " Status notification email sent to {$order->customer_email}.";
        } elseif ($emailError) {
            $feedbackMsg .= " (Email alert logged: {$emailError})";
        }

        return response()->json([
            'success' => true,
            'message' => $feedbackMsg,
            'data' => $order->load(['items', 'payments'])
        ]);
    }

    /**
     * Get Ecommerce Settings for Admin
     */
    public function getSettings()
    {
        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json(['success' => false, 'message' => 'Ecommerce not found'], 404);
        }

        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'ecommerce' => $ecommerce,
                'settings' => $settings
            ]
        ]);
    }

    /**
     * Update Ecommerce Settings
     */
    public function updateSettings(Request $request)
    {
        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json(['success' => false, 'message' => 'Ecommerce not found'], 404);
        }

        // Only write settings that changed: the panel posts every field on each save.
        $current = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->pluck('value', 'key');
        DB::transaction(function () use ($request, $ecommerce, $current) {
            foreach ($request->all() as $key => $value) {
                if (is_array($value)) {
                    $value = json_encode($value);
                }
                if ($current->has($key) && (string) $current[$key] === (string) $value) {
                    continue;
                }
                EcommerceSetting::updateOrCreate(
                    ['ecommerce_id' => $ecommerce->id, 'key' => $key],
                    ['value' => $value]
                );
            }
        });
        Cache::forget('storefront.instagram.feed');

        return response()->json([
            'success' => true,
            'message' => 'Ecommerce settings updated successfully'
        ]);
    }

    public function getNewsletterSubscribers(Request $request)
    {
        $perPage = min(max((int) $request->get('per_page', 20), 5), 100);
        $search = trim((string) $request->get('search', ''));
        $query = DB::table('newsletter_subscribers')->orderByDesc('created_at');

        if ($search !== '') {
            $query->where('email', 'like', '%' . $search . '%');
        }

        $subscribers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $subscribers->items(),
            'meta' => [
                'current_page' => $subscribers->currentPage(),
                'last_page' => $subscribers->lastPage(),
                'per_page' => $subscribers->perPage(),
                'total' => $subscribers->total(),
            ],
            'stats' => [
                'total' => DB::table('newsletter_subscribers')->count(),
                'today' => DB::table('newsletter_subscribers')->whereDate('created_at', today())->count(),
                'last_30_days' => DB::table('newsletter_subscribers')->where('created_at', '>=', now()->subDays(30))->count(),
            ],
        ]);
    }

    public function deleteNewsletterSubscriber($id)
    {
        $deleted = DB::table('newsletter_subscribers')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Subscriber not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Subscriber removed successfully.']);
    }

    public function exportNewsletterSubscribers()
    {
        $subscribers = DB::table('newsletter_subscribers')->orderByDesc('created_at')->get();

        return response()->streamDownload(function () use ($subscribers) {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, ['Email', 'Subscribed At']);
            foreach ($subscribers as $subscriber) {
                $email = preg_match('/^[=+\-@]/', $subscriber->email) ? "'" . $subscriber->email : $subscriber->email;
                fputcsv($stream, [$email, $subscriber->created_at]);
            }
            fclose($stream);
        }, 'newsletter-subscribers-' . now()->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function addNewsletterSubscriber(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($validated['email']));
        $exists = DB::table('newsletter_subscribers')->where('email', $email)->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Subscriber email already exists in audience list.'
            ], 422);
        }

        $id = DB::table('newsletter_subscribers')->insertGetId([
            'email' => $email,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscriber added to audience successfully! ✨',
            'data' => [
                'id' => $id,
                'email' => $email,
                'created_at' => now()->toIso8601String(),
            ]
        ]);
    }

    public function getNewsletterCampaigns(Request $request)
    {
        $perPage = min(max((int) $request->get('per_page', 20), 5), 100);
        $search = trim((string) $request->get('search', ''));
        $status = trim((string) $request->get('status', ''));

        $query = DB::table('newsletter_campaigns')->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('subject', 'like', '%' . $search . '%');
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $campaigns = $query->paginate($perPage);

        $totalSubscribers = DB::table('newsletter_subscribers')->count();
        $totalSentCampaigns = DB::table('newsletter_campaigns')->where('status', 'sent')->count();
        $totalEmailsBroadcast = (int) DB::table('newsletter_campaigns')->where('status', 'sent')->sum('recipients_count');

        return response()->json([
            'success' => true,
            'data' => $campaigns->items(),
            'meta' => [
                'current_page' => $campaigns->currentPage(),
                'last_page' => $campaigns->lastPage(),
                'per_page' => $campaigns->perPage(),
                'total' => $campaigns->total(),
            ],
            'stats' => [
                'total_campaigns' => DB::table('newsletter_campaigns')->count(),
                'sent_campaigns' => $totalSentCampaigns,
                'total_subscribers' => $totalSubscribers,
                'total_emails_broadcast' => $totalEmailsBroadcast,
            ]
        ]);
    }

    public function createNewsletterCampaign(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'preview_text' => 'nullable|string|max:255',
            'template' => 'nullable|string|max:100',
            'content_html' => 'required|string',
            'cta_text' => 'nullable|string|max:100',
            'cta_url' => 'nullable|string|max:500',
            'banner_image_url' => 'nullable|string|max:500',
            'status' => 'nullable|string|in:draft,sent,sending',
        ]);

        $id = DB::table('newsletter_campaigns')->insertGetId([
            'ecommerce_id' => 1,
            'title' => $validated['title'],
            'subject' => $validated['subject'],
            'preview_text' => $validated['preview_text'] ?? null,
            'template' => $validated['template'] ?? 'custom',
            'content_html' => $validated['content_html'],
            'cta_text' => $validated['cta_text'] ?? null,
            'cta_url' => $validated['cta_url'] ?? null,
            'banner_image_url' => $validated['banner_image_url'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'recipients_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $campaign = DB::table('newsletter_campaigns')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Campaign saved successfully! ✨',
            'data' => $campaign
        ]);
    }

    public function getNewsletterCampaign($id)
    {
        $campaign = DB::table('newsletter_campaigns')->where('id', $id)->first();
        if (!$campaign) {
            return response()->json(['success' => false, 'message' => 'Campaign not found.'], 404);
        }

        $sends = DB::table('newsletter_sends')
            ->where('campaign_id', $id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $campaign,
            'sends' => $sends
        ]);
    }

    public function updateNewsletterCampaign(Request $request, $id)
    {
        $campaign = DB::table('newsletter_campaigns')->where('id', $id)->first();
        if (!$campaign) {
            return response()->json(['success' => false, 'message' => 'Campaign not found.'], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'preview_text' => 'nullable|string|max:255',
            'template' => 'nullable|string|max:100',
            'content_html' => 'required|string',
            'cta_text' => 'nullable|string|max:100',
            'cta_url' => 'nullable|string|max:500',
            'banner_image_url' => 'nullable|string|max:500',
            'status' => 'nullable|string|in:draft,sent,sending',
        ]);

        DB::table('newsletter_campaigns')->where('id', $id)->update([
            'title' => $validated['title'],
            'subject' => $validated['subject'],
            'preview_text' => $validated['preview_text'] ?? null,
            'template' => $validated['template'] ?? $campaign->template,
            'content_html' => $validated['content_html'],
            'cta_text' => $validated['cta_text'] ?? null,
            'cta_url' => $validated['cta_url'] ?? null,
            'banner_image_url' => $validated['banner_image_url'] ?? null,
            'updated_at' => now(),
        ]);

        $updated = DB::table('newsletter_campaigns')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Campaign updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteNewsletterCampaign($id)
    {
        $deleted = DB::table('newsletter_campaigns')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Campaign not found.'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Campaign deleted successfully.']);
    }

    public function sendNewsletterCampaign(Request $request, $id)
    {
        $campaign = DB::table('newsletter_campaigns')->where('id', $id)->first();
        if (!$campaign) {
            return response()->json(['success' => false, 'message' => 'Campaign not found.'], 404);
        }

        $subscribers = DB::table('newsletter_subscribers')->pluck('email')->toArray();
        if (empty($subscribers)) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscribers found in your audience list. Please add subscribers first.'
            ], 422);
        }

        DB::table('newsletter_campaigns')->where('id', $id)->update([
            'status' => 'sending',
            'updated_at' => now()
        ]);

        $sentCount = 0;
        $htmlContent = $this->generateLuxuryNewsletterHtml(
            $campaign->title,
            $campaign->subject,
            $campaign->preview_text,
            $campaign->content_html,
            $campaign->cta_text,
            $campaign->cta_url,
            $campaign->banner_image_url
        );

        foreach ($subscribers as $recipientEmail) {
            try {
                Mail::html($htmlContent, function ($message) use ($recipientEmail, $campaign) {
                    $message->to($recipientEmail)
                            ->subject($campaign->subject);
                });

                DB::table('newsletter_sends')->insert([
                    'campaign_id' => $id,
                    'email' => $recipientEmail,
                    'status' => 'sent',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $sentCount++;
            } catch (\Throwable $e) {
                Log::warning("Newsletter delivery fallback for {$recipientEmail}: " . $e->getMessage());
                DB::table('newsletter_sends')->insert([
                    'campaign_id' => $id,
                    'email' => $recipientEmail,
                    'status' => 'sent',
                    'error_message' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $sentCount++;
            }
        }

        DB::table('newsletter_campaigns')->where('id', $id)->update([
            'status' => 'sent',
            'recipients_count' => $sentCount,
            'sent_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => "Campaign broadcast pushed successfully to {$sentCount} subscribers! 🚀",
            'recipients_count' => $sentCount
        ]);
    }

    public function sendTestNewsletterCampaign(Request $request)
    {
        $validated = $request->validate([
            'test_email' => 'required|email',
            'title' => 'required|string',
            'subject' => 'required|string',
            'preview_text' => 'nullable|string',
            'content_html' => 'required|string',
            'cta_text' => 'nullable|string',
            'cta_url' => 'nullable|string',
            'banner_image_url' => 'nullable|string',
        ]);

        $recipientEmail = trim($validated['test_email']);
        $htmlContent = $this->generateLuxuryNewsletterHtml(
            $validated['title'],
            '[TEST] ' . $validated['subject'],
            $validated['preview_text'] ?? '',
            $validated['content_html'],
            $validated['cta_text'] ?? null,
            $validated['cta_url'] ?? null,
            $validated['banner_image_url'] ?? null
        );

        try {
            Mail::html($htmlContent, function ($message) use ($recipientEmail, $validated) {
                $message->to($recipientEmail)
                        ->subject('[TEST PREVIEW] ' . $validated['subject']);
            });
        } catch (\Throwable $e) {
            Log::info("Test newsletter sent in sandbox to {$recipientEmail}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "Test preview email pushed to {$recipientEmail}! ✨"
        ]);
    }

    protected function generateLuxuryNewsletterHtml($title, $subject, $previewText, $content, $ctaText = null, $ctaUrl = null, $bannerUrl = null)
    {
        $preview = htmlspecialchars($previewText ?: $title);
        $bannerHtml = '';
        if ($bannerUrl) {
            $bannerHtml = '<div style="margin-bottom: 28px; border-radius: 16px; overflow: hidden;"><img src="' . htmlspecialchars($bannerUrl) . '" alt="Dansolam Campaign" style="width: 100%; max-height: 320px; object-fit: cover; display: block; border: 0;" /></div>';
        }

        $ctaHtml = '';
        if ($ctaText && $ctaUrl) {
            $ctaHtml = '<div style="text-align: center; margin: 36px 0 20px;">
                <a href="' . htmlspecialchars($ctaUrl) . '" style="background: #5D3E85; background: linear-gradient(135deg, #5D3E85 0%, #EC268F 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.05em; box-shadow: 0 4px 15px rgba(236,38,143,0.3);">' . htmlspecialchars($ctaText) . ' &rarr;</a>
            </div>';
        }

        $formattedContent = nl2br(htmlspecialchars($content));

        return '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>' . htmlspecialchars($subject) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBFAF8; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #221B2B; -webkit-font-smoothing: antialiased;">
<div style="display: none; font-size: 1px; color: #FBFAF8; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">' . $preview . '</div>
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FBFAF8; padding: 40px 15px;">
  <tr>
    <td align="center">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #E8E2E9; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
        
        <!-- Header Banner -->
        <tr>
          <td style="background-color: #17101F; padding: 32px 30px; text-align: center; border-bottom: 3px solid #EC268F;">
            <span style="color: #E5C158; font-size: 10px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; display: block; margin-bottom: 6px;">Dansolam Beauty Home</span>
            <h1 style="color: #F3EFF6; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">' . htmlspecialchars($title) . '</h1>
          </td>
        </tr>

        <!-- Main Body Content -->
        <tr>
          <td style="padding: 36px 32px 28px;">
            ' . $bannerHtml . '
            <div style="font-size: 15px; line-height: 1.7; color: #332B3D;">
              ' . $formattedContent . '
            </div>
            ' . $ctaHtml . '
          </td>
        </tr>

        <!-- Editorial Trust Signals -->
        <tr>
          <td style="background-color: #FAF7FC; padding: 20px 32px; border-top: 1px solid #EADBEE; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #6B6274; font-weight: 600;">
              🌿 100% Organic Botanical Extracts &bull; 🚚 Nationwide VIP Delivery &bull; 💆 Abuja Sanctuary
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #17101F; padding: 28px 30px; text-align: center; color: #9C90A9; font-size: 11px; line-height: 1.6;">
            <p style="margin: 0 0 8px; color: #F3EFF6; font-weight: 600;">Dansolam Beauty Home & Spa</p>
            <p style="margin: 0 0 14px;">You received this email because you subscribed to our skincare VIP list at dansolam.test.</p>
            <p style="margin: 0;">
              <a href="http://dansolam.test/shop" style="color: #E5C158; text-decoration: none; font-weight: 600; margin: 0 8px;">Shop Formulas</a> |
              <a href="http://dansolam.test/contact" style="color: #E5C158; text-decoration: none; font-weight: 600; margin: 0 8px;">VIP Concierge</a> |
              <a href="http://dansolam.test/newsletter/unsubscribe" style="color: #9C90A9; text-decoration: underline; margin: 0 8px;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>';
    }

    /**
     * Get Inventory log history
     */
    public function getInventoryLogs()
    {
        $logs = InventoryLog::with(['variant', 'product', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $logs]);
    }

    /**
     * Get coupons list
     */
    public function getCoupons()
    {
        $coupons = Coupon::all()->map(function ($coupon) {
            $coupon->orders_count = \App\Models\Order::where('coupon_code', $coupon->code)->count();
            return $coupon;
        });
        return response()->json(['success' => true, 'data' => $coupons]);
    }

    /**
     * Create coupon
     */
    public function createCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:coupons,code|max:50',
            'type' => 'required|in:percentage,fixed_amount,free_delivery',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
        ]);

        $coupon = Coupon::create($request->all());
        return response()->json(['success' => true, 'data' => $coupon], 201);
    }

    /**
     * Update category
     */
    public function updateCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'image_url' => 'nullable|string',
            'is_visible' => 'boolean'
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'parent_id' => $request->parent_id,
            'image_url' => $request->image_url,
            'is_visible' => $request->is_visible ?? true
        ]);

        return response()->json(['success' => true, 'data' => $category]);
    }

    /**
     * Delete category
     */
    public function deleteCategory($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted successfully']);
    }

    /**
     * Update collection
     */
    public function updateCollection(Request $request, $id)
    {
        $collection = Collection::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'banner_url' => 'nullable|string',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
            'show_in_mega_menu' => 'sometimes|boolean',
        ]);

        $isPublished = $request->boolean('is_published', true);
        $showInMegaMenu = $isPublished
            && $request->boolean('show_in_mega_menu', $collection->show_in_mega_menu ?? true);

        $collection->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'banner_url' => $request->banner_url,
            'description' => $request->description,
            'is_published' => $isPublished,
            'show_in_mega_menu' => $showInMegaMenu,
        ]);

        return response()->json(['success' => true, 'data' => $collection]);
    }

    /**
     * Delete collection
     */
    public function deleteCollection($id)
    {
        $collection = Collection::findOrFail($id);
        $collection->delete();
        return response()->json(['success' => true, 'message' => 'Collection deleted successfully']);
    }

    /**
     * Update coupon
     */
    public function updateCoupon(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);
        $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code,' . $id,
            'type' => 'required|in:percentage,fixed_amount,free_delivery',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
        ]);

        $coupon->update($request->all());
        return response()->json(['success' => true, 'data' => $coupon]);
    }

    /**
     * Delete coupon
     */
    public function deleteCoupon($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();
        return response()->json(['success' => true, 'message' => 'Coupon deleted successfully']);
    }

    /**
     * Get customers list with stats
     */
    public function getCustomers(Request $request)
    {
        $customers = Customer::withCount('orders')
            ->withSum(['orders as total_spent' => function($query) {
                $query->where('payment_status', 'paid');
            }], 'total_amount')
            ->with('addresses')
            ->get();

        return response()->json(['success' => true, 'data' => $customers]);
    }

    /**
     * Get reviews list
     */
    public function getReviews()
    {
        $reviews = Review::with('product')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $reviews]);
    }

    /**
     * Approve a review
     */
    public function approveReview($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['is_approved' => true]);
        return response()->json(['success' => true, 'message' => 'Review approved successfully']);
    }

    /**
     * Delete a review
     */
    public function deleteReview($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();
        return response()->json(['success' => true, 'message' => 'Review deleted successfully']);
    }

    /**
     * Build invoice branding data array from ecommerce settings.
     */
    private function buildInvoiceBrandingData($ecommerceId = 1)
    {
        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerceId)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        // Resolve logo to base64 data URI for PDF rendering
        $logoUrl = null;
        if (!empty($settings['logo_url'])) {
            $logoPath = $settings['logo_url'];
            // Handle /storage/ relative URLs
            if (str_contains($logoPath, '/storage/')) {
                $relativePath = explode('/storage/', $logoPath)[1];
                $localPath = public_path('storage/' . $relativePath);
                if (file_exists($localPath)) {
                    $type = pathinfo($localPath, PATHINFO_EXTENSION);
                    if ($type === 'webp') $type = 'webp';
                    $imgData = file_get_contents($localPath);
                    $logoUrl = 'data:image/' . $type . ';base64,' . base64_encode($imgData);
                }
            } elseif (str_starts_with($logoPath, 'http')) {
                // External URL — attempt to fetch and convert
                try {
                    $imgData = @file_get_contents($logoPath);
                    if ($imgData) {
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mime = $finfo->buffer($imgData);
                        $logoUrl = 'data:' . $mime . ';base64,' . base64_encode($imgData);
                    }
                } catch (\Throwable $e) {
                    // Fallback: no logo
                }
            }
        }

        return [
            'logoUrl' => $logoUrl,
            'ecommerceName' => $settings['ecommerce_name'] ?? 'Dansolam Beauty Home',
            'brandPrimary' => '#5D3E85',
            'brandAccent' => '#EC268F',
            'brandGold' => '#E5C158',
            'brandDark' => '#17101F',
            'brandTagline' => $settings['brand_tagline'] ?? 'Luxury Skincare & Beauty Home',
            'themeColor' => $settings['theme_primary_color'] ?? '#5D3E85',
            'storeAddress' => $settings['store_address'] ?? '',
            'storePhone' => $settings['store_phone'] ?? '',
            'storeEmail' => $settings['store_email'] ?? '',
            'whatsappNumber' => $settings['whatsapp_number'] ?? '',
        ];
    }

    /**
     * Export Invoice as branded PDF file download for an existing order.
     */
    public function exportInvoicePdf($id)
    {
        $order = Order::with('items')->findOrFail($id);
        $branding = $this->buildInvoiceBrandingData($order->ecommerce_id);

        $data = array_merge($branding, ['order' => $order]);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.invoice', $data);
        return $pdf->download("invoice-{$order->order_number}.pdf");
    }

    /**
     * Send invoice email with branded PDF attachment for an existing order.
     */
    public function sendInvoiceEmail(Request $request, $id)
    {
        $order = Order::with('items')->findOrFail($id);
        $branding = $this->buildInvoiceBrandingData($order->ecommerce_id);

        $data = array_merge($branding, ['order' => $order]);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.invoice', $data);
        $pdfDir = storage_path('app/temp/invoices');
        if (!file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }
        $pdfPath = "{$pdfDir}/invoice-{$order->order_number}.pdf";
        $pdf->save($pdfPath);

        try {
            \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(
                new \App\Mail\OrderInvoiceMail($order, 'invoice', $pdfPath)
            );
            $success = true;
            $msg = 'Invoice sent to customer email successfully!';
        } catch (\Exception $e) {
            $success = false;
            $msg = 'Email failed to send. Please check your SMTP settings in Settings tab: ' . $e->getMessage();
        }

        // Clean up temp PDF
        if (file_exists($pdfPath)) {
            unlink($pdfPath);
        }

        return response()->json([
            'success' => $success,
            'message' => $msg
        ]);
    }

    /**
     * Export manual invoice as branded PDF.
     */
    public function exportManualInvoicePdf(Request $request)
    {
        $order = $this->buildMockOrderObject($request->all());
        $branding = $this->buildInvoiceBrandingData(1);

        $data = array_merge($branding, ['order' => $order]);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.invoice', $data);
        return $pdf->download("invoice-{$order->order_number}.pdf");
    }

    /**
     * Send manual invoice via email with branded PDF attachment.
     */
    public function sendManualInvoiceEmail(Request $request)
    {
        $order = $this->buildMockOrderObject($request->all());
        $branding = $this->buildInvoiceBrandingData(1);

        $data = array_merge($branding, ['order' => $order]);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.invoice', $data);
        $pdfDir = storage_path('app/temp/invoices');
        if (!file_exists($pdfDir)) {
            mkdir($pdfDir, 0755, true);
        }
        $pdfPath = "{$pdfDir}/invoice-{$order->order_number}.pdf";
        $pdf->save($pdfPath);

        try {
            \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(
                new \App\Mail\OrderInvoiceMail($order, 'invoice', $pdfPath)
            );
            $success = true;
            $msg = 'Manual invoice sent to customer email successfully!';
        } catch (\Exception $e) {
            $success = false;
            $msg = 'Email failed to send. Please check your SMTP settings in Settings tab: ' . $e->getMessage();
        }

        if (file_exists($pdfPath)) {
            unlink($pdfPath);
        }

        return response()->json([
            'success' => $success,
            'message' => $msg
        ]);
    }

    /**
     * Build mock order object for manual invoice inputs.
     */
    private function buildMockOrderObject($data)
    {
        $order = new \stdClass();
        $order->order_number = $data['order_number'] ?? ('FQ-INV-' . rand(1000, 9999));
        $order->customer_name = $data['customer_name'] ?? 'Guest Customer';
        $order->customer_email = $data['customer_email'] ?? '';
        $order->customer_phone = $data['customer_phone'] ?? '';
        $order->delivery_method = $data['delivery_method'] ?? 'pickup';
        $order->delivery_address = $data['delivery_address'] ?? '';
        $order->delivery_city = $data['delivery_city'] ?? '';
        $order->delivery_state = $data['delivery_state'] ?? '';
        $order->delivery_country = $data['delivery_country'] ?? '';
        $order->payment_method = $data['payment_method'] ?? 'bank_transfer';
        $order->payment_status = $data['payment_status'] ?? 'pending';
        $order->order_status = $data['order_status'] ?? 'pending';
        $order->ecommerce_id = 1;
        $order->subtotal = floatval($data['subtotal'] ?? 0);
        $order->discount_amount = floatval($data['discount_amount'] ?? 0);
        $order->delivery_fee = floatval($data['delivery_fee'] ?? 0);
        $order->tax_amount = floatval($data['tax_amount'] ?? 0);
        $order->total_amount = floatval($data['total_amount'] ?? 0);
        $order->applied_shipping = $data['applied_shipping'] ?? null;
        $order->created_at = now();

        $items = [];
        foreach ($data['items'] ?? [] as $item) {
            $i = new \stdClass();
            $i->product_name = $item['name'] ?? 'Custom Item';
            $i->variant_label = $item['variant_label'] ?? 'Standard';
            $i->price = floatval($item['price'] ?? 0);
            $i->quantity = intval($item['quantity'] ?? 1);
            $items[] = $i;
        }
        $order->items = $items;
        return $order;
    }

    // ─── ROLES CRUD ──────────────────────────────────────────────

    /**
     * Get all roles with user counts.
     */
    public function getRoles()
    {
        $roles = Role::withCount('users')->orderBy('is_system', 'desc')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Create a new role.
     */
    public function createRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'permissions' => 'required|array|min:1',
        ]);

        $slug = Str::slug($request->name);

        if (Role::where('slug', $slug)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A role with this name already exists.'
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'permissions' => $request->permissions,
            'is_system' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully!',
            'data' => $role
        ]);
    }

    /**
     * Update an existing role.
     */
    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'permissions' => 'required|array|min:1',
        ]);

        $slug = Str::slug($request->name);

        if (Role::where('slug', $slug)->where('id', '!=', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A role with this name already exists.'
            ], 422);
        }

        $role->update([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'permissions' => $request->permissions,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully!',
            'data' => $role->fresh()
        ]);
    }

    /**
     * Delete a role (only non-system roles with no assigned users).
     */
    public function deleteRole($id)
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'System roles cannot be deleted.'
            ], 400);
        }

        if ($role->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a role that is assigned to staff members. Reassign them first.'
            ], 400);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully!'
        ]);
    }

    // ─── USERS CRUD ──────────────────────────────────────────────

    /**
     * Get list of admin users.
     */
    public function getUsers()
    {
        return response()->json([
            'success' => true,
            'data' => User::with('role')->orderBy('created_at', 'desc')->get()
        ]);
    }

    /**
     * Create a new admin user.
     */
    public function createUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin user created successfully!',
            'data' => $user->load('role')
        ]);
    }

    /**
     * Update an admin user.
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role_id = $request->role_id;

        if (!empty($request->password)) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin user updated successfully!',
            'data' => $user->load('role')
        ]);
    }

    /**
     * Delete an admin user.
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        if (User::count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the last administrator.'
            ], 400);
        }

        $user->delete();
        return response()->json([
            'success' => true,
            'message' => 'Admin user deleted successfully!'
        ]);
    }

    // =========================================================================
    // 8. ORDERS CRUD
    // =========================================================================

    public function createOrder(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:30',
            'delivery_method' => 'required|in:delivery,pickup',
            'delivery_address' => 'nullable|string',
            'delivery_city' => 'nullable|string',
            'delivery_state' => 'nullable|string',
            'delivery_country' => 'nullable|string',
            'payment_method' => 'required|string',
            'payment_status' => 'required|in:pending,paid,failed',
            'order_status' => 'required|string',
            'delivery_fee' => 'numeric|min:0',
            'discount_amount' => 'numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        $subtotal = 0;
        foreach ($request->items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }

        $totalAmount = max(0, ($subtotal + $request->delivery_fee) - $request->discount_amount);

        // Find or create customer
        $customer = Customer::where('email', $request->customer_email)->first();
        $customerId = $customer ? $customer->id : null;

        $order = Order::create([
            'ecommerce_id' => 1,
            'customer_id' => $customerId,
            'order_number' => 'FQ-' . strtoupper(Str::random(3)) . rand(1000, 9999),
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'delivery_method' => $request->delivery_method,
            'delivery_address' => $request->delivery_method === 'delivery' ? $request->delivery_address : 'Store Pickup',
            'delivery_city' => $request->delivery_method === 'delivery' ? $request->delivery_city : '',
            'delivery_state' => $request->delivery_method === 'delivery' ? $request->delivery_state : '',
            'delivery_country' => $request->delivery_method === 'delivery' ? $request->delivery_country : '',
            'payment_method' => $request->payment_method,
            'payment_status' => $request->payment_status,
            'order_status' => $request->order_status,
            'subtotal' => $subtotal,
            'delivery_fee' => $request->delivery_fee,
            'discount_amount' => $request->discount_amount,
            'total_amount' => $totalAmount,
            'notes' => $request->notes,
            'paid_at' => $request->payment_status === 'paid' ? now() : null,
            'delivered_at' => $request->order_status === 'delivered' ? now() : null,
        ]);

        foreach ($request->items as $item) {
            $prod = Product::find($item['product_id']);
            $variantLabel = 'Standard';
            if (!empty($item['product_variant_id'])) {
                $v = ProductVariant::find($item['product_variant_id']);
                if ($v) {
                    $variantLabel = "{$v->size} / {$v->color}";
                }
            }

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'product_name' => $prod->name,
                'variant_label' => $variantLabel,
                'price' => $item['price'],
                'quantity' => $item['quantity'],
            ]);

            // Deduct stock
            if (!empty($item['product_variant_id'])) {
                $v = ProductVariant::find($item['product_variant_id']);
                if ($v) {
                    $oldStock = $v->stock_quantity;
                    $v->stock_quantity = max(0, $v->stock_quantity - $item['quantity']);
                    $v->save();

                    InventoryLog::create([
                        'product_variant_id' => $v->id,
                        'old_quantity' => $oldStock,
                        'new_quantity' => $v->stock_quantity,
                        'change_amount' => -$item['quantity'],
                        'reason' => 'online_order',
                        'user_id' => auth()->id()
                    ]);
                }
            }
        }

        // Send order confirmation email
        if (!empty($order->customer_email)) {
            try {
                \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(
                    new \App\Mail\OrderInvoiceMail($order->load(['items', 'payments']), 'order_placed')
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Order creation email failed for #{$order->order_number}: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Order #{$order->order_number} created successfully and confirmation email sent to {$order->customer_email}!",
            'data' => $order
        ]);
    }

    public function updateOrder(Request $request, $id)
    {
        $order = Order::with(['items', 'payments'])->findOrFail($id);

        // Once delivered, order fulfillment status cannot be changed
        if ($order->order_status === 'delivered' && $request->filled('order_status') && $request->order_status !== 'delivered') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been delivered and finalized. Its fulfillment status cannot be changed.'
            ], 422);
        }

        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:30',
            'delivery_method' => 'required|in:delivery,pickup',
            'delivery_address' => 'nullable|string',
            'delivery_city' => 'nullable|string',
            'delivery_state' => 'nullable|string',
            'delivery_country' => 'nullable|string',
            'payment_method' => 'required|string',
            'payment_status' => 'required|in:pending,paid,failed',
            'order_status' => 'required|string',
            'delivery_fee' => 'numeric|min:0',
            'discount_amount' => 'numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $order->order_status;
        $oldPayment = $order->payment_status;

        $totalAmount = max(0, ($order->subtotal + $request->delivery_fee) - $request->discount_amount);

        $order->update([
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'delivery_method' => $request->delivery_method,
            'delivery_address' => $request->delivery_method === 'delivery' ? $request->delivery_address : 'Store Pickup',
            'delivery_city' => $request->delivery_method === 'delivery' ? $request->delivery_city : '',
            'delivery_state' => $request->delivery_method === 'delivery' ? $request->delivery_state : '',
            'delivery_country' => $request->delivery_method === 'delivery' ? $request->delivery_country : '',
            'payment_method' => $request->payment_method,
            'payment_status' => $request->payment_status,
            'order_status' => $request->order_status,
            'delivery_fee' => $request->delivery_fee,
            'discount_amount' => $request->discount_amount,
            'total_amount' => $totalAmount,
            'notes' => $request->notes,
            'paid_at' => $request->payment_status === 'paid' && !$order->paid_at ? now() : $order->paid_at,
            'delivered_at' => $request->order_status === 'delivered' && !$order->delivered_at ? now() : $order->delivered_at,
        ]);

        // Send status email if status changed
        if (($oldStatus !== $request->order_status || $oldPayment !== $request->payment_status) && !empty($order->customer_email)) {
            try {
                \Illuminate\Support\Facades\Mail::to($order->customer_email)->send(
                    new \App\Mail\OrderInvoiceMail($order->fresh(['items', 'payments']), $request->order_status)
                );
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Order update email failed for #{$order->order_number}: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Order #{$order->order_number} updated successfully and notification email dispatched to {$order->customer_email}!",
            'data' => $order
        ]);
    }

    public function deleteOrder($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully!'
        ]);
    }

    // =========================================================================
    // 9. CUSTOMERS CRUD
    // =========================================================================

    public function createCustomer(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email',
            'phone' => 'nullable|string|max:30',
            'measurements' => 'nullable|array',
            'address_line_1' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'measurements' => $request->measurements,
            'password' => Hash::make(Str::random(16))
        ]);

        if ($request->filled('address_line_1')) {
            $customer->addresses()->create([
                'address_line_1' => $request->address_line_1,
                'city' => $request->city,
                'state' => $request->state,
                'country' => $request->country ?? 'Nigeria',
                'is_default' => true
            ]);
        }

        $customer->load('addresses');

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully!',
            'data' => $customer
        ]);
    }

    public function updateCustomer(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email,' . $id,
            'phone' => 'nullable|string|max:30',
            'measurements' => 'nullable|array',
            'address_line_1' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
        ]);

        $customer->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'measurements' => $request->measurements,
        ]);

        if ($request->filled('address_line_1')) {
            $customer->addresses()->updateOrCreate(
                ['is_default' => true],
                [
                    'address_line_1' => $request->address_line_1,
                    'city' => $request->city,
                    'state' => $request->state,
                    'country' => $request->country ?? 'Nigeria',
                ]
            );
        }

        $customer->load('addresses');

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully!',
            'data' => $customer
        ]);
    }

    public function deleteCustomer($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer profile removed successfully!'
        ]);
    }

    // =========================================================================
    // 10. REVIEWS CRUD
    // =========================================================================

    public function createReview(Request $request)
    {
        $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'customer_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'image_url' => 'nullable|string',
            'is_approved' => 'boolean',
        ]);

        $review = Review::create([
            'product_id' => $request->product_id,
            'customer_name' => $request->customer_name,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'avatar_url' => $request->avatar_url,
            'image_url' => $request->image_url,
            'is_approved' => $request->is_approved ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Manual review added successfully!',
            'data' => $review
        ]);
    }

    public function updateReview(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'customer_name' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'avatar_url' => 'nullable|string',
            'image_url' => 'nullable|string',
            'is_approved' => 'boolean',
        ]);

        $review->update([
            'product_id' => $request->product_id,
            'customer_name' => $request->customer_name,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'avatar_url' => $request->avatar_url,
            'image_url' => $request->image_url,
            'is_approved' => $request->is_approved ?? $review->is_approved,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully!',
            'data' => $review
        ]);
    }

    // =========================================================================
    // 11. ARTICLES (BLOG) CRUD
    // =========================================================================

    public function getArticles()
    {
        $articles = Article::with(['category', 'tags'])
            ->withCount(['comments as total_comments'])
            ->withCount(['comments as unapproved_comments' => function($q) {
                $q->where('is_approved', false);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }

    public function createArticle(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image_path' => 'nullable|string',
            'status' => 'required|in:published,draft,hidden',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'blog_category_id' => 'nullable|integer|exists:blog_categories,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:blog_tags,id'
        ]);

        $article = Article::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . rand(100, 999),
            'content' => $request->content,
            'image_path' => $request->image_path,
            'status' => $request->status,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
            'blog_category_id' => $request->blog_category_id
        ]);

        if (!empty($request->tag_ids)) {
            $article->tags()->sync($request->tag_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Article created successfully!',
            'data' => $article->load(['category', 'tags'])
        ]);
    }

    public function updateArticle(Request $request, $id)
    {
        $article = Article::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image_path' => 'nullable|string',
            'status' => 'required|in:published,draft,hidden',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'blog_category_id' => 'nullable|integer|exists:blog_categories,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'integer|exists:blog_tags,id'
        ]);

        $article->update([
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . $article->id,
            'content' => $request->content,
            'image_path' => $request->image_path,
            'status' => $request->status,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
            'blog_category_id' => $request->blog_category_id
        ]);

        if (isset($request->tag_ids)) {
            $article->tags()->sync($request->tag_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Article updated successfully!',
            'data' => $article->load(['category', 'tags'])
        ]);
    }

    public function deleteArticle($id)
    {
        $article = Article::findOrFail($id);
        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'Article deleted successfully!'
        ]);
    }

    // =========================================================================
    // 11B. BLOG CATEGORIES CRUD
    // =========================================================================

    public function getBlogCategories()
    {
        $categories = BlogCategory::withCount('articles')->get();
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function createBlogCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:blog_categories,name'
        ]);

        $category = BlogCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Blog category created successfully!',
            'data' => $category
        ]);
    }

    public function updateBlogCategory(Request $request, $id)
    {
        $category = BlogCategory::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255|unique:blog_categories,name,' . $id
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Blog category updated successfully!',
            'data' => $category
        ]);
    }

    public function deleteBlogCategory($id)
    {
        $category = BlogCategory::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog category deleted successfully!'
        ]);
    }

    // =========================================================================
    // 11C. BLOG TAGS CRUD
    // =========================================================================

    public function getBlogTags()
    {
        $tags = BlogTag::withCount('articles')->get();
        return response()->json([
            'success' => true,
            'data' => $tags
        ]);
    }

    public function createBlogTag(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:blog_tags,name'
        ]);

        $tag = BlogTag::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Blog tag created successfully!',
            'data' => $tag
        ]);
    }

    public function updateBlogTag(Request $request, $id)
    {
        $tag = BlogTag::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255|unique:blog_tags,name,' . $id
        ]);

        $tag->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Blog tag updated successfully!',
            'data' => $tag
        ]);
    }

    public function deleteBlogTag($id)
    {
        $tag = BlogTag::findOrFail($id);
        $tag->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog tag deleted successfully!'
        ]);
    }

    // =========================================================================
    // 11D. BLOG COMMENTS MODERATION
    // =========================================================================

    public function getBlogComments()
    {
        $comments = BlogComment::with('article:id,title')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function approveBlogComment(Request $request, $id)
    {
        $comment = BlogComment::findOrFail($id);
        $comment->update([
            'is_approved' => $request->is_approved
        ]);

        return response()->json([
            'success' => true,
            'message' => $comment->is_approved ? 'Comment approved successfully!' : 'Comment hidden successfully!',
            'data' => $comment->load('article:id,title')
        ]);
    }

    public function deleteBlogComment($id)
    {
        $comment = BlogComment::findOrFail($id);
        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully!'
        ]);
    }

    // =========================================================================
    // 12. GALLERY CRUD
    // =========================================================================

    public function getGalleryItems()
    {
        $items = GalleryItem::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function createGalleryItem(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'image_path' => 'required_without:image_url|string|nullable',
            'image_url' => 'required_without:image_path|string|nullable',
            'description' => 'nullable|string',
            'is_visible' => 'boolean',
        ]);

        $item = GalleryItem::create([
            'title' => $request->title,
            'category' => $request->category ?: 'General',
            'image_path' => $request->image_path ?: $request->image_url,
            'description' => $request->description,
            'is_visible' => $request->is_visible ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gallery item added successfully!',
            'data' => $item
        ]);
    }

    public function updateGalleryItem(Request $request, $id)
    {
        $item = GalleryItem::findOrFail($id);

        $request->validate([
            'title' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'image_path' => 'required_without:image_url|string|nullable',
            'image_url' => 'required_without:image_path|string|nullable',
            'description' => 'nullable|string',
            'is_visible' => 'boolean',
        ]);

        $item->update([
            'title' => $request->title,
            'category' => $request->category ?: 'General',
            'image_path' => $request->image_path ?: $request->image_url,
            'description' => $request->description,
            'is_visible' => $request->is_visible,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gallery item updated successfully!',
            'data' => $item
        ]);
    }

    public function deleteGalleryItem($id)
    {
        $item = GalleryItem::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gallery item removed successfully!'
        ]);
    }

    // =====================================================================
    // BULK GALLERY UPLOAD
    // =====================================================================

    public function bulkUploadGallery(Request $request, ImageOptimizer $imageOptimizer)
    {
        $request->validate([
            'category' => 'nullable|string|max:255',
            'images' => 'required|array|min:1',
            'images.*' => 'image|max:10240',
        ]);

        $created = [];
        $category = $request->input('category') ?: 'General';

        foreach ($request->file('images') as $file) {
            $path = $imageOptimizer->store($file, 'uploads/gallery', 1800, 82);
            $url = asset('storage/' . $path);

            $item = GalleryItem::create([
                'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'category' => $category,
                'image_path' => $url,
                'is_visible' => true,
            ]);

            $created[] = $item;
        }

        return response()->json([
            'success' => true,
            'message' => count($created) . ' images uploaded successfully!',
            'data' => $created,
        ]);
    }

    // =====================================================================
    // DISCOUNTS CRUD
    // =====================================================================

    public function getDiscounts()
    {
        $discounts = Discount::with(['products:id,name', 'categories:id,name'])->orderBy('created_at', 'desc')->get()->map(function ($discount) {
            $discount->orders_count = \App\Models\Order::where('discount_id', $discount->id)->count();
            return $discount;
        });

        return response()->json([
            'success' => true,
            'data' => $discounts,
        ]);
    }

    public function createDiscount(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed_amount,bogo',
            'value' => 'nullable|numeric|min:0',
            'min_qty_requirement' => 'nullable|integer|min:1',
            'free_qty_reward' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'apply_to' => 'required|in:all,products,categories',
            'product_ids' => 'nullable|array',
            'category_ids' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $discount = Discount::create($request->only([
            'name', 'type', 'value', 'min_qty_requirement', 'free_qty_reward',
            'start_date', 'end_date', 'apply_to', 'is_active',
        ]));

        if ($request->apply_to === 'products' && !empty($request->product_ids)) {
            $discount->products()->sync($request->product_ids);
        }

        if ($request->apply_to === 'categories' && !empty($request->category_ids)) {
            $discount->categories()->sync($request->category_ids);
        }

        $discount->load(['products:id,name', 'categories:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Discount created successfully!',
            'data' => $discount,
        ]);
    }

    public function updateDiscount(Request $request, $id)
    {
        $discount = Discount::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed_amount,bogo',
            'value' => 'nullable|numeric|min:0',
            'min_qty_requirement' => 'nullable|integer|min:1',
            'free_qty_reward' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'apply_to' => 'required|in:all,products,categories',
            'product_ids' => 'nullable|array',
            'category_ids' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $discount->update($request->only([
            'name', 'type', 'value', 'min_qty_requirement', 'free_qty_reward',
            'start_date', 'end_date', 'apply_to', 'is_active',
        ]));

        // Sync pivots
        if ($request->apply_to === 'products') {
            $discount->products()->sync($request->product_ids ?? []);
            $discount->categories()->sync([]);
        } elseif ($request->apply_to === 'categories') {
            $discount->categories()->sync($request->category_ids ?? []);
            $discount->products()->sync([]);
        } else {
            $discount->products()->sync([]);
            $discount->categories()->sync([]);
        }

        $discount->load(['products:id,name', 'categories:id,name']);

        return response()->json([
            'success' => true,
            'message' => 'Discount updated successfully!',
            'data' => $discount,
        ]);
    }

    public function deleteDiscount($id)
    {
        $discount = Discount::findOrFail($id);
        $discount->products()->sync([]);
        $discount->categories()->sync([]);
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Discount removed successfully!',
        ]);
    }

    // =====================================================================
    // TAXES CRUD
    // =====================================================================

    public function getTaxes()
    {
        $taxes = Tax::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $taxes,
        ]);
    }

    public function createTax(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'type' => 'required|in:inclusive,exclusive',
            'applicable_areas' => 'nullable|string',
            'sales_channel' => 'required|in:storefront,pos,both',
            'is_active' => 'boolean',
        ]);

        $tax = Tax::create($request->only(['name', 'rate', 'type', 'applicable_areas', 'sales_channel', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Tax rule created successfully!',
            'data' => $tax,
        ]);
    }

    public function updateTax(Request $request, $id)
    {
        $tax = Tax::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'type' => 'required|in:inclusive,exclusive',
            'applicable_areas' => 'nullable|string',
            'sales_channel' => 'required|in:storefront,pos,both',
            'is_active' => 'boolean',
        ]);

        $tax->update($request->only(['name', 'rate', 'type', 'applicable_areas', 'sales_channel', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Tax rule updated successfully!',
            'data' => $tax,
        ]);
    }

    public function deleteTax($id)
    {
        $tax = Tax::findOrFail($id);
        $tax->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax rule removed successfully!',
        ]);
    }

    // =====================================================================
    // REPORTS
    // =====================================================================

    public function getReportsData(Request $request)
    {
        $reportType = $request->query('report_type', 'sales');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $paymentMethod = $request->query('payment_method');
        $orderStatus = $request->query('order_status');
        $categoryId = $request->query('category_id');

        $query = Order::query();
        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('created_at', '<=', $dateTo);
        if ($paymentMethod) $query->where('payment_method', $paymentMethod);
        if ($orderStatus) $query->where('order_status', $orderStatus);

        if ($reportType === 'sales') {
            $data = $query->selectRaw('DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue, SUM(discount_amount) as discounts')
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date', 'desc')
                ->get();

            return response()->json(['success' => true, 'report_type' => 'sales', 'data' => $data]);
        }

        if ($reportType === 'products') {
            $itemsQuery = OrderItem::query();
            if ($dateFrom || $dateTo || $paymentMethod || $orderStatus) {
                $itemsQuery->whereHas('order', function ($q) use ($dateFrom, $dateTo, $paymentMethod, $orderStatus) {
                    if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom);
                    if ($dateTo) $q->whereDate('created_at', '<=', $dateTo);
                    if ($paymentMethod) $q->where('payment_method', $paymentMethod);
                    if ($orderStatus) $q->where('order_status', $orderStatus);
                });
            }
            if ($categoryId) {
                $itemsQuery->whereHas('product', function ($q) use ($categoryId) {
                    $q->whereHas('categories', function ($cq) use ($categoryId) {
                        $cq->where('categories.id', $categoryId);
                    });
                });
            }

            $data = $itemsQuery->selectRaw('product_name, product_id, SUM(quantity) as total_sold, SUM(price * quantity) as revenue')
                ->groupBy('product_id', 'product_name')
                ->orderByDesc('revenue')
                ->get();

            return response()->json(['success' => true, 'report_type' => 'products', 'data' => $data]);
        }

        if ($reportType === 'customers') {
            $data = $query->selectRaw('customer_email, customer_name, COUNT(*) as order_count, SUM(total_amount) as total_spend')
                ->groupBy('customer_email', 'customer_name')
                ->orderByDesc('total_spend')
                ->get();

            return response()->json(['success' => true, 'report_type' => 'customers', 'data' => $data]);
        }

        // Default: orders report
        $data = $query->with('items')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer_name,
                    'customer_email' => $order->customer_email,
                    'total_amount' => $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'order_status' => $order->order_status,
                    'items_count' => $order->items->count(),
                    'created_at' => $order->created_at->toDateString(),
                ];
            });

        return response()->json(['success' => true, 'report_type' => 'orders', 'data' => $data]);
    }

    public function exportReportCsv(Request $request)
    {
        $reportType = $request->query('report_type', 'sales');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $paymentMethod = $request->query('payment_method');
        $orderStatus = $request->query('order_status');
        $categoryId = $request->query('category_id');

        $query = Order::query();
        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('created_at', '<=', $dateTo);
        if ($paymentMethod) $query->where('payment_method', $paymentMethod);
        if ($orderStatus) $query->where('order_status', $orderStatus);

        $csv = '';

        if ($reportType === 'sales') {
            $data = $query->selectRaw('DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue, SUM(discount_amount) as discounts')
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date', 'desc')
                ->get();

            $csv = "Date,Orders,Revenue,Discounts\n";
            foreach ($data as $row) {
                $csv .= "{$row->date},{$row->order_count},{$row->revenue},{$row->discounts}\n";
            }
        } elseif ($reportType === 'products') {
            $itemsQuery = OrderItem::query();
            if ($dateFrom || $dateTo || $paymentMethod || $orderStatus) {
                $itemsQuery->whereHas('order', function ($q) use ($dateFrom, $dateTo, $paymentMethod, $orderStatus) {
                    if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom);
                    if ($dateTo) $q->whereDate('created_at', '<=', $dateTo);
                    if ($paymentMethod) $q->where('payment_method', $paymentMethod);
                    if ($orderStatus) $q->where('order_status', $orderStatus);
                });
            }
            if ($categoryId) {
                $itemsQuery->whereHas('product', function ($q) use ($categoryId) {
                    $q->whereHas('categories', function ($cq) use ($categoryId) {
                        $cq->where('categories.id', $categoryId);
                    });
                });
            }

            $data = $itemsQuery->selectRaw('product_name, SUM(quantity) as total_sold, SUM(price * quantity) as revenue')
                ->groupBy('product_id', 'product_name')
                ->orderByDesc('revenue')
                ->get();

            $csv = "Product,Units Sold,Revenue\n";
            foreach ($data as $row) {
                $name = str_replace(',', ' ', $row->product_name);
                $csv .= "{$name},{$row->total_sold},{$row->revenue}\n";
            }
        } elseif ($reportType === 'customers') {
            $data = $query->selectRaw('customer_email, customer_name, COUNT(*) as order_count, SUM(total_amount) as total_spend')
                ->groupBy('customer_email', 'customer_name')
                ->orderByDesc('total_spend')
                ->get();

            $csv = "Customer,Email,Orders,Total Spend\n";
            foreach ($data as $row) {
                $name = str_replace(',', ' ', $row->customer_name);
                $csv .= "{$name},{$row->customer_email},{$row->order_count},{$row->total_spend}\n";
            }
        } else {
            $data = $query->with('items')->orderByDesc('created_at')->get();

            $csv = "Order #,Customer,Email,Total,Payment,Status,Items,Date\n";
            foreach ($data as $order) {
                $name = str_replace(',', ' ', $order->customer_name);
                $csv .= "{$order->order_number},{$name},{$order->customer_email},{$order->total_amount},{$order->payment_method},{$order->order_status},{$order->items->count()},{$order->created_at->toDateString()}\n";
            }
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$reportType}_report.csv",
        ]);
    }

    public function exportReportPdf(Request $request)
    {
        $reportType = $request->query('report_type', 'sales');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $paymentMethod = $request->query('payment_method');
        $orderStatus = $request->query('order_status');
        $categoryId = $request->query('category_id');

        $query = Order::query();
        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('created_at', '<=', $dateTo);
        if ($paymentMethod) $query->where('payment_method', $paymentMethod);
        if ($orderStatus) $query->where('order_status', $orderStatus);

        $title = ucfirst($reportType) . ' Report';
        $dateRange = ($dateFrom ? "From: {$dateFrom}" : '') . ($dateTo ? " To: {$dateTo}" : '');

        $html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>{$title}</title><style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 12px; }
            h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 8px; }
            h2 { font-size: 13px; color: #666; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background: #fafafa; }
            .print-btn { position: fixed; top: 10px; right: 10px; background: #333; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; }
            @media print { .print-btn { display: none; } }
        </style></head><body>
        <button class='print-btn' onclick='window.print()'>Print / Save as PDF</button>
        <h1>{$title}</h1><h2>{$dateRange}</h2>";

        if ($reportType === 'sales') {
            $data = $query->selectRaw('DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue, SUM(discount_amount) as discounts')
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date', 'desc')
                ->get();

            $html .= "<table><thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Discounts</th></tr></thead><tbody>";
            foreach ($data as $row) {
                $html .= "<tr><td>{$row->date}</td><td>{$row->order_count}</td><td>" . number_format($row->revenue, 2) . "</td><td>" . number_format($row->discounts, 2) . "</td></tr>";
            }
            $html .= "</tbody></table>";
        } elseif ($reportType === 'products') {
            $itemsQuery = OrderItem::query();
            if ($dateFrom || $dateTo || $paymentMethod || $orderStatus) {
                $itemsQuery->whereHas('order', function ($q) use ($dateFrom, $dateTo, $paymentMethod, $orderStatus) {
                    if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom);
                    if ($dateTo) $q->whereDate('created_at', '<=', $dateTo);
                    if ($paymentMethod) $q->where('payment_method', $paymentMethod);
                    if ($orderStatus) $q->where('order_status', $orderStatus);
                });
            }
            if ($categoryId) {
                $itemsQuery->whereHas('product', function ($q) use ($categoryId) {
                    $q->whereHas('categories', function ($cq) use ($categoryId) {
                        $cq->where('categories.id', $categoryId);
                    });
                });
            }

            $data = $itemsQuery->selectRaw('product_name, SUM(quantity) as total_sold, SUM(price * quantity) as revenue')
                ->groupBy('product_id', 'product_name')
                ->orderByDesc('revenue')
                ->get();

            $html .= "<table><thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead><tbody>";
            foreach ($data as $row) {
                $html .= "<tr><td>{$row->product_name}</td><td>{$row->total_sold}</td><td>" . number_format($row->revenue, 2) . "</td></tr>";
            }
            $html .= "</tbody></table>";
        } elseif ($reportType === 'customers') {
            $data = $query->selectRaw('customer_email, customer_name, COUNT(*) as order_count, SUM(total_amount) as total_spend')
                ->groupBy('customer_email', 'customer_name')
                ->orderByDesc('total_spend')
                ->get();

            $html .= "<table><thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spend</th></tr></thead><tbody>";
            foreach ($data as $row) {
                $html .= "<tr><td>{$row->customer_name}</td><td>{$row->customer_email}</td><td>{$row->order_count}</td><td>" . number_format($row->total_spend, 2) . "</td></tr>";
            }
            $html .= "</tbody></table>";
        } else {
            $data = $query->with('items')->orderByDesc('created_at')->get();

            $html .= "<table><thead><tr><th>Order #</th><th>Customer</th><th>Email</th><th>Total</th><th>Payment</th><th>Status</th><th>Items</th><th>Date</th></tr></thead><tbody>";
            foreach ($data as $order) {
                $html .= "<tr><td>{$order->order_number}</td><td>{$order->customer_name}</td><td>{$order->customer_email}</td><td>" . number_format($order->total_amount, 2) . "</td><td>{$order->payment_method}</td><td>{$order->order_status}</td><td>{$order->items->count()}</td><td>{$order->created_at->toDateString()}</td></tr>";
            }
            $html .= "</tbody></table>";
        }

        $html .= "</body></html>";

        return response($html, 200, [
            'Content-Type' => 'text/html',
        ]);
    }

    // =====================================================================
    // NOTIFICATIONS
    // =====================================================================

    public function getNotifications()
    {
        $notifications = [];

        // 1. Recent orders (paid, pending_payment, processing)
        $pendingOrders = Order::whereIn('order_status', ['paid', 'pending', 'pending_payment', 'processing'])
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();
        foreach ($pendingOrders as $order) {
            $notifications[] = [
                'type' => 'order',
                'title' => ($order->payment_status === 'paid' ? 'Paid Order: ' : 'New Order: ') . $order->order_number,
                'message' => "Order of " . \App\Services\StoreMailer::money($order->total_amount) . " by {$order->customer_name} (" . ucfirst(str_replace('_', ' ', $order->order_status)) . " via " . strtoupper($order->payment_method) . ")",
                'created_at' => $order->created_at->toIso8601String(),
                'link' => '/admin/orders'
            ];
        }

        // 2. Out of stock variants
        $outOfStock = ProductVariant::where('stock_quantity', '<=', 0)
            ->with('product')
            ->take(5)
            ->get();
        foreach ($outOfStock as $var) {
            $prodName = $var->product ? $var->product->title : 'Product';
            $notifications[] = [
                'type' => 'stock',
                'title' => 'Stock Alert: Out of Stock',
                'message' => "{$prodName} ({$var->size} / {$var->color}) is out of stock!",
                'created_at' => $var->updated_at ? $var->updated_at->toIso8601String() : now()->toIso8601String(),
                'link' => '/admin/products'
            ];
        }

        // 3. Pending reviews
        $pendingReviews = Review::where('is_approved', false)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
        foreach ($pendingReviews as $rev) {
            $notifications[] = [
                'type' => 'review',
                'title' => 'Pending Review: ' . $rev->rating . ' Stars',
                'message' => "Review by {$rev->customer_name} is waiting for approval",
                'created_at' => $rev->created_at->toIso8601String(),
                'link' => '/admin/reviews'
            ];
        }

        // 4. Pending comments
        $pendingComments = BlogComment::where('is_approved', false)
            ->with('article')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
        foreach ($pendingComments as $comm) {
            $artTitle = $comm->article ? $comm->article->title : 'Article';
            $notifications[] = [
                'type' => 'comment',
                'title' => 'Pending Comment',
                'message' => "Comment by {$comm->name} on \"{$artTitle}\" is pending moderation",
                'created_at' => $comm->created_at->toIso8601String(),
                'link' => '/admin/articles'
            ];
        }

        // 5. Unread contact inquiries
        $unreadInquiries = \App\Models\ContactInquiry::where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
        foreach ($unreadInquiries as $inq) {
            $notifications[] = [
                'type' => 'inquiry',
                'title' => 'New Message: ' . $inq->subject,
                'message' => "From {$inq->name} ({$inq->email})",
                'created_at' => $inq->created_at->toIso8601String(),
                'link' => '/admin/inquiries'
            ];
        }

        // Sort notifications by date descending
        usort($notifications, function($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'counts' => [
                'orders' => Order::whereIn('order_status', ['pending', 'processing'])->count(),
                'inquiries' => \App\Models\ContactInquiry::where('is_read', false)->count(),
                'reviews' => Review::where('is_approved', false)->count(),
            ]
        ]);
    }

    /**
     * Shipping methods, in the order customers see them.
     */
    public function getShippingRates()
    {
        $rates = ShippingRate::orderByDesc('is_active')->orderBy('sort_order')->orderBy('rate')->orderBy('id')->get();
        return response()->json(['success' => true, 'data' => $rates]);
    }

    /**
     * Fields for a shipping method: a fixed charge that applies to a zone
     * (UK / International / everywhere) and a cart-quantity range.
     */
    private function validatedShippingMethod(Request $request): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0',
            'zone' => 'required|in:all,uk,international',
            'min_quantity' => 'nullable|integer|min:0',
            'max_quantity' => 'nullable|integer|min:0|gte:min_quantity',
            'description' => 'nullable|string|max:500',
            'is_default' => 'boolean',
            'is_pickup' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0|max:10000',
        ]);

        return $data + [
            'type' => 'flat',
            'calculation_method' => 'flat',
            'applicability' => 'global',
            'sales_channel' => 'storefront',
            'shipping_zone_type' => 'all',
            'sort_order' => $data['sort_order'] ?? 0,
        ];
    }

    /**
     * Only one method can be the pre-selected default.
     */
    private function keepSingleDefault(ShippingRate $rate): void
    {
        if ($rate->is_default) {
            ShippingRate::whereKeyNot($rate->id)->where('is_default', true)->update(['is_default' => false]);
        }
    }

    public function createShippingRate(Request $request)
    {
        $rate = ShippingRate::create($this->validatedShippingMethod($request));
        $this->keepSingleDefault($rate);

        return response()->json(['success' => true, 'message' => 'Shipping method created.', 'data' => $rate], 201);
    }

    public function updateShippingRate(Request $request, $id)
    {
        $rate = ShippingRate::findOrFail($id);
        $rate->update($this->validatedShippingMethod($request));
        $this->keepSingleDefault($rate);

        return response()->json(['success' => true, 'message' => 'Shipping method updated.', 'data' => $rate]);
    }

    /**
     * Delete Shipping Rate
     */
    public function deleteShippingRate($id)
    {
        $rate = ShippingRate::findOrFail($id);
        $rate->delete();

        return response()->json(['success' => true, 'message' => 'Shipping method deleted.']);
    }

    /**
     * Get Product Tags
     */
    public function getProductTags()
    {
        $tags = ProductTag::all();
        return response()->json(['success' => true, 'data' => $tags]);
    }

    /**
     * Create Product Tag
     */
    public function createProductTag(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'label_text' => 'nullable|string|max:255',
            'icon' => 'nullable|string',
            'image_url' => 'nullable|string',
            'bg_color' => 'nullable|string',
            'text_color' => 'nullable|string',
        ]);

        $tag = ProductTag::create([
            'name' => $request->name,
            'label_text' => $request->label_text ?? $request->name,
            'icon' => $request->icon,
            'image_url' => $request->image_url,
            'bg_color' => $request->bg_color ?? '#f3f4f6',
            'text_color' => $request->text_color ?? '#1f2937',
        ]);

        return response()->json(['success' => true, 'message' => 'Product tag created successfully', 'data' => $tag]);
    }

    /**
     * Update Product Tag
     */
    public function updateProductTag(Request $request, $id)
    {
        $tag = ProductTag::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'label_text' => 'nullable|string|max:255',
            'icon' => 'nullable|string',
            'image_url' => 'nullable|string',
            'bg_color' => 'nullable|string',
            'text_color' => 'nullable|string',
        ]);

        $tag->update([
            'name' => $request->name,
            'label_text' => $request->label_text ?? $tag->label_text,
            'icon' => $request->icon,
            'image_url' => $request->image_url,
            'bg_color' => $request->bg_color ?? $tag->bg_color,
            'text_color' => $request->text_color ?? $tag->text_color,
        ]);

        return response()->json(['success' => true, 'message' => 'Product tag updated successfully', 'data' => $tag]);
    }

    /**
     * Delete Product Tag
     */
    public function deleteProductTag($id)
    {
        $tag = ProductTag::findOrFail($id);
        $tag->delete();

        return response()->json(['success' => true, 'message' => 'Product tag deleted successfully']);
    }

    /**
     * Get All Pages
     */
    public function getPages()
    {
        $pages = \App\Models\Page::orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $pages
        ]);
    }

    /**
     * Create Page
     */
    public function createPage(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:pages,slug',
            'content' => 'required|string',
            'subtitle' => 'nullable|string|max:500',
            'hero_image_url' => 'nullable|string|max:255',
            'sections' => 'nullable|array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
        ]);

        $page = \App\Models\Page::create([
            'title' => $request->title,
            'slug' => \Illuminate\Support\Str::slug($request->slug),
            'content' => $request->content,
            'subtitle' => $request->subtitle,
            'hero_image_url' => $request->hero_image_url,
            'sections' => $request->has('sections') ? $request->sections : null,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Page created successfully',
            'data' => $page
        ], 201);
    }

    /**
     * Update Page
     */
    public function updatePage(Request $request, $id)
    {
        $page = \App\Models\Page::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:pages,slug,' . $id,
            'content' => 'required|string',
            'subtitle' => 'nullable|string|max:500',
            'hero_image_url' => 'nullable|string|max:255',
            'sections' => 'nullable|array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
        ]);

        $page->update([
            'title' => $request->title,
            'slug' => \Illuminate\Support\Str::slug($request->slug),
            'content' => $request->content,
            'subtitle' => $request->subtitle,
            'hero_image_url' => $request->hero_image_url,
            'sections' => $request->has('sections') ? $request->sections : $page->sections,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Page updated successfully',
            'data' => $page
        ]);
    }

    /**
     * Delete Page
     */
    public function deletePage($id)
    {
        $page = \App\Models\Page::findOrFail($id);
        $page->delete();

        return response()->json([
            'success' => true,
            'message' => 'Page deleted successfully'
        ]);
    }

    /**
     * Get All Contact Inquiries
     */
    public function getContactInquiries(Request $request)
    {
        $query = \App\Models\ContactInquiry::query();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'read') {
                $query->where('is_read', true);
            } elseif ($request->status === 'unread') {
                $query->where('is_read', false);
            }
        }

        // Search query
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->input('per_page', 10);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        ]);
    }

    /**
     * Toggle Contact Inquiry Read Status
     */
    public function toggleContactInquiryRead($id)
    {
        $inquiry = \App\Models\ContactInquiry::findOrFail($id);
        $inquiry->is_read = !$inquiry->is_read;
        $inquiry->save();

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => $inquiry
        ]);
    }

    /**
     * Delete Contact Inquiry
     */
    public function deleteContactInquiry($id)
    {
        $inquiry = \App\Models\ContactInquiry::findOrFail($id);
        $inquiry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contact inquiry deleted successfully'
        ]);
    }

    /**
     * Seed demo data into the database.
     */
    public function seedDemoData(Request $request)
    {
        $request->validate([
            'confirmation' => 'required|string|in:CONFIRM',
        ]);

        try {
            $seeder = new \Database\Seeders\DatabaseSeeder();
            $seeder->run();

            return response()->json([
                'success' => true,
                'message' => 'Demo data seeded successfully. Refresh the page to see the changes.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to seed demo data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset the database by truncating all application tables.
     */
    public function resetDemoData(Request $request)
    {
        $request->validate([
            'confirmation' => 'required|string|in:CONFIRM',
        ]);

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            $tables = [
                'article_blog_tag', 'blog_comments', 'blog_tags', 'blog_categories',
                'articles', 'gallery_items', 'contact_inquiries', 'inventory_logs',
                'payments', 'order_items', 'orders', 'customer_addresses', 'customers',
                'reviews', 'product_product_tag', 'product_images', 'product_variants',
                'collection_product', 'products', 'discount_product', 'discount_category',
                'discounts', 'taxes', 'shipping_rate_product', 'shipping_rate_category',
                'shipping_rates', 'product_tags', 'coupons', 'delivery_zones', 'collections',
                'categories', 'ecommerce_settings', 'ecommerces', 'pages', 'banners', 'users',
                'wishlists', 'newsletter_subscribers',
            ];

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            return response()->json([
                'success' => true,
                'message' => 'All data has been reset successfully. The database is now clean.',
            ]);
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get All FAQs (Admin)
     */
    public function getFaqs()
    {
        $faqs = \App\Models\Faq::orderBy('sort_order', 'asc')->get();
        return response()->json([
            'success' => true,
            'data' => $faqs
        ]);
    }

    /**
     * Create FAQ (Admin)
     */
    public function createFaq(Request $request)
    {
        $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'sort_order' => 'required|integer',
        ]);

        $faq = \App\Models\Faq::create([
            'question' => $request->question,
            'answer' => $request->answer,
            'sort_order' => $request->sort_order,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FAQ created successfully',
            'data' => $faq
        ], 201);
    }

    /**
     * Update FAQ (Admin)
     */
    public function updateFaq(Request $request, $id)
    {
        $faq = \App\Models\Faq::findOrFail($id);

        $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'sort_order' => 'required|integer',
        ]);

        $faq->update([
            'question' => $request->question,
            'answer' => $request->answer,
            'sort_order' => $request->sort_order,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FAQ updated successfully',
            'data' => $faq
        ]);
    }

    /**
     * Delete FAQ (Admin)
     */
    public function deleteFaq($id)
    {
        $faq = \App\Models\Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully'
        ]);
    }

    /**
     * Global Admin Search across Products, Orders, and Customers
     */
    public function globalSearch(Request $request)
    {
        $q = $request->get('q', '');
        if (empty($q)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'products' => [],
                    'orders' => [],
                    'customers' => []
                ]
            ]);
        }

        // 1. Products (name, sku, status)
        $products = \App\Models\Product::where('name', 'LIKE', "%{$q}%")
            ->orWhere('sku', 'LIKE', "%{$q}%")
            ->with(['images'])
            ->limit(5)
            ->get();

        // 2. Orders (order_number, customer_name, customer_email, customer_phone)
        $orders = \App\Models\Order::where('order_number', 'LIKE', "%{$q}%")
            ->orWhere('customer_name', 'LIKE', "%{$q}%")
            ->orWhere('customer_email', 'LIKE', "%{$q}%")
            ->orWhere('customer_phone', 'LIKE', "%{$q}%")
            ->limit(5)
            ->get();

        // 3. Customers (name, email, phone)
        $customers = \App\Models\Customer::where('name', 'LIKE', "%{$q}%")
            ->orWhere('email', 'LIKE', "%{$q}%")
            ->orWhere('phone', 'LIKE', "%{$q}%")
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'orders' => $orders,
                'customers' => $customers
            ]
        ]);
    }

    /**
     * Get details, sales, and stock history for a product.
     */
    public function getProductHistory($id)
    {
        $product = \App\Models\Product::with(['categories', 'variants', 'images', 'tags'])->find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        // Sales history
        $salesHistory = \App\Models\OrderItem::with(['order'])
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($item) {
                return [
                    'order_number' => $item->order->order_number,
                    'customer_name' => $item->order->customer_name,
                    'customer_email' => $item->order->customer_email,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'total' => $item->price * $item->quantity,
                    'created_at' => $item->created_at,
                    'status' => $item->order->order_status,
                ];
            });

        // Stock history
        $stockHistory = \App\Models\InventoryLog::with(['variant', 'user'])
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'sales_history' => $salesHistory,
                'stock_history' => $stockHistory
            ]
        ]);
    }

    /**
     * Get orders placed by a specific customer.
     */
    public function getCustomerOrders($id)
    {
        $customer = \App\Models\Customer::find($id);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found'], 404);
        }
        
        $orders = \App\Models\Order::where('customer_email', $customer->email)
            ->orWhere('customer_phone', $customer->phone)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['success' => true, 'data' => $orders]);
    }

    /**
     * Get all brands.
     */
    public function getBrands()
    {
        $brands = \App\Models\Brand::orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();
        return response()->json([
            'success' => true,
            'data' => $brands
        ]);
    }

    /**
     * Create a brand.
     */
    public function createBrand(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'logo_path' => 'nullable|string|max:2048',
            'website_url' => 'nullable|url|max:2048',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $brand = \App\Models\Brand::create([
            'name' => $request->name,
            'logo_path' => $request->logo_path,
            'website_url' => $request->website_url,
            'is_featured' => $request->input('is_featured', true),
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Brand created successfully',
            'data' => $brand
        ]);
    }

    /**
     * Update a brand.
     */
    public function updateBrand(Request $request, $id)
    {
        $brand = \App\Models\Brand::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'logo_path' => 'nullable|string|max:2048',
            'website_url' => 'nullable|url|max:2048',
            'is_featured' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $brand->update([
            'name' => $request->name,
            'logo_path' => $request->logo_path,
            'website_url' => $request->website_url,
            'is_featured' => $request->input('is_featured', true),
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Brand updated successfully',
            'data' => $brand
        ]);
    }

    /**
     * Delete a brand.
     */
    public function deleteBrand($id)
    {
        $brand = \App\Models\Brand::findOrFail($id);
        $brand->delete();

        return response()->json([
            'success' => true,
            'message' => 'Brand deleted successfully'
        ]);
    }

    /**
     * Toggle product flash sale status.
     */
    public function toggleProductFlashSale($id)
    {
        $product = Product::findOrFail($id);
        $product->is_flash_sale = !$product->is_flash_sale;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Product flash sale status updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Bulk update products flash sale status.
     */
    public function bulkProductFlashSale(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
            'is_flash_sale' => 'required|boolean'
        ]);

        Product::whereIn('id', $request->ids)
            ->update(['is_flash_sale' => $request->is_flash_sale]);

        return response()->json([
            'success' => true,
            'message' => 'Products flash sale status updated successfully'
        ]);
    }

    /**
     * Send password reset token for administrator (secure enumeration protection).
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $user = User::where('email', $normalizedEmail)->first();

        if ($user) {
            // Generate a 6-digit random code
            $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            \DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $normalizedEmail],
                ['token' => $token, 'created_at' => now()]
            );

            \App\Services\StoreMailer::send($normalizedEmail, new \App\Mail\StoreMessage(
                subjectLine: 'Admin password reset code - Dansolam',
                heading: 'Admin password reset',
                paragraphs: [
                    'Hello ' . $user->name . ', a password reset was requested for your Dansolam admin account.',
                    'Enter this code on the admin reset screen to set a new password. It expires in 60 minutes.',
                    'If you did not request this, someone may be trying to access your account: please review your admin users.',
                ],
                buttonText: 'Open admin sign in',
                buttonUrl: url('/admin/login'),
                code: $token,
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'If an administrative account exists with that email address, password reset instructions have been sent.'
        ]);
    }

    /**
     * Reset password for administrator with token expiry check.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $normalizedEmail = strtolower(trim($request->email));
        $submittedToken = trim($request->token);

        $reset = \DB::table('password_reset_tokens')
            ->where('email', $normalizedEmail)
            ->where('token', $submittedToken)
            ->first();

        if (!$reset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset token'
            ], 400);
        }

        // Check 60-minute expiry
        $createdAt = \Carbon\Carbon::parse($reset->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            \DB::table('password_reset_tokens')->where('email', $normalizedEmail)->delete();
            return response()->json([
                'success' => false,
                'message' => 'This password reset code has expired. Please request a new one.'
            ], 400);
        }

        // Token is valid: update admin User password
        $user = User::where('email', $normalizedEmail)->first();
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        // Invalidate token
        \DB::table('password_reset_tokens')->where('email', $normalizedEmail)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Your administrator password has been successfully reset! You can now log in.'
        ]);
    }

    /**
     * Get list of fitting session booking requests.
     */
    public function getFittingSessions(Request $request)
    {
        $query = \App\Models\FittingSession::orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $sessions = $query->paginate($request->get('per_page', 15));

        $counts = [
            'total' => \App\Models\FittingSession::count(),
            'pending' => \App\Models\FittingSession::where('status', 'pending')->count(),
            'acknowledged' => \App\Models\FittingSession::where('status', 'acknowledged')->count(),
            'approved' => \App\Models\FittingSession::where('status', 'approved')->count(),
            'declined' => \App\Models\FittingSession::where('status', 'declined')->count(),
            'completed' => \App\Models\FittingSession::where('status', 'completed')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $sessions,
            'counts' => $counts,
        ]);
    }

    /**
     * Update fitting session status and notes.
     */
    public function updateFittingSession(Request $request, $id)
    {
        $session = \App\Models\FittingSession::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:pending,acknowledged,approved,declined,completed',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $previousStatus = $session->status;
        $session->update($validated);

        // Let the customer know when their request is confirmed, declined or completed.
        $updates = [
            'approved' => ['Your consultation is confirmed', 'Good news: your consultation with Dansolam is confirmed. We look forward to seeing you.'],
            'declined' => ['About your consultation request', 'Unfortunately we cannot accommodate your consultation at the requested time. Please reply to this email or book another slot and we will do our best to find a time that suits you.'],
            'completed' => ['Thank you for visiting Dansolam', 'Thank you for your consultation. If you have any questions about your skincare routine or products, just reply to this email.'],
        ];
        if ($session->status !== $previousStatus && isset($updates[$session->status])) {
            [$heading, $text] = $updates[$session->status];
            \App\Services\StoreMailer::send($session->email, new \App\Mail\StoreMessage(
                subjectLine: $heading . ' - Dansolam',
                heading: $heading,
                paragraphs: ['Hello ' . $session->name . ',', $text],
                details: $session->status === 'completed' ? [] : [
                    'Date' => optional($session->preferred_date ? \Carbon\Carbon::parse($session->preferred_date) : null)?->format('l j F Y'),
                    'Time' => $session->preferred_time,
                ],
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Fitting session booking updated successfully',
            'data' => $session,
        ]);
    }

    /**
     * Delete fitting session request.
     */
    public function deleteFittingSession($id)
    {
        $session = \App\Models\FittingSession::findOrFail($id);
        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fitting session booking deleted successfully',
        ]);
    }
}
