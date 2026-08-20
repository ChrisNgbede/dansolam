<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderInvoiceMail;
use App\Models\Ecommerce;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PayPalController extends Controller
{
    protected PayPalService $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    /**
     * Browser-safe PayPal SDK config (client id is public; the secret is never sent).
     */
    public function clientConfig()
    {
        return response()->json([
            'success' => true,
            'data' => $this->paypalService->getClientConfig(),
        ]);
    }

    /**
     * Create PayPal Order via Orders API v2 (POST /v2/checkout/orders)
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'order_number' => 'required|string|exists:orders,order_number',
        ]);

        $order = Order::with('items')->where('order_number', $request->order_number)->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid.',
            ], 400);
        }

        $items = [];
        foreach ($order->items as $item) {
            $items[] = [
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'price' => floatval($item->price),
                'quantity' => intval($item->quantity),
            ];
        }

        $returnUrl = $request->input('return_url') ?: url("/checkout?paypal_return=true&order_number={$order->order_number}");
        $cancelUrl = $request->input('cancel_url') ?: url("/checkout?paypal_cancel=true");

        $paypalRes = $this->paypalService->createOrder(
            $order->order_number,
            floatval($order->total_amount),
            null,
            $items,
            $returnUrl,
            $cancelUrl
        );

        if (!$paypalRes['success']) {
            return response()->json([
                'success' => false,
                'message' => $paypalRes['message'] ?? 'Failed to initialize PayPal order.',
            ], 500);
        }

        // Store/Update Payment log with PayPal Order ID
        $paypalOrderId = $paypalRes['paypal_order_id'];
        Payment::updateOrCreate(
            ['order_id' => $order->id, 'gateway' => 'paypal'],
            [
                'transaction_reference' => $paypalOrderId,
                'amount' => $order->total_amount,
                'status' => 'pending',
                'gateway_response' => $paypalRes['raw'] ?? [],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'PayPal order initialized successfully.',
            'data' => [
                'paypal_order_id' => $paypalOrderId,
                'approve_url' => $paypalRes['approve_url'],
                'order_number' => $order->order_number,
                'amount' => $paypalRes['amount'],
                'currency' => $paypalRes['currency'],
                'mock' => $paypalRes['mock'] ?? false,
            ]
        ]);
    }

    /**
     * Capture payment for PayPal Order via Orders API v2 (POST /v2/checkout/orders/{id}/capture)
     */
    public function captureOrder(Request $request)
    {
        $request->validate([
            'paypal_order_id' => 'required|string',
            'order_number' => 'required|string|exists:orders,order_number',
        ]);

        $order = Order::where('order_number', $request->order_number)->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json([
                'success' => true,
                'message' => 'Order is already marked as paid.',
                'data' => [
                    'order_number' => $order->order_number,
                    'payment_status' => 'paid',
                ]
            ]);
        }

        $captureRes = $this->paypalService->captureOrder($request->paypal_order_id);

        if (!$captureRes['success']) {
            return response()->json([
                'success' => false,
                'message' => $captureRes['message'] ?? 'PayPal payment capture failed.',
            ], 400);
        }

        $captureId = $captureRes['capture_id'] ?? $request->paypal_order_id;

        // Update Payment record
        $payment = Payment::where('order_id', $order->id)->where('gateway', 'paypal')->first();
        if (!$payment) {
            $payment = new Payment();
            $payment->order_id = $order->id;
            $payment->gateway = 'paypal';
            $payment->amount = $order->total_amount;
        }

        $payment->transaction_reference = $captureId;
        $payment->status = 'success';
        $payment->gateway_response = $captureRes['raw'] ?? [];
        $payment->save();

        // Update Order record
        $order->payment_status = 'paid';
        $order->order_status = 'paid';
        $order->paid_at = now();
        $order->save();

        // Dispatch Invoice Email
        try {
            if (!empty($order->customer_email)) {
                Mail::to($order->customer_email)->send(new OrderInvoiceMail($order, 'payment_success'));
            }
        } catch (\Throwable $mailEx) {
            Log::warning("PayPal capture email notification failed: " . $mailEx->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'PayPal payment captured successfully!',
            'data' => [
                'order_number' => $order->order_number,
                'paypal_order_id' => $request->paypal_order_id,
                'capture_id' => $captureId,
                'status' => $captureRes['status'] ?? 'COMPLETED',
                'payer' => $captureRes['payer'] ?? null,
            ]
        ]);
    }

    /**
     * Authorize payment for order via Orders API v2 (POST /v2/checkout/orders/{id}/authorize)
     */
    public function authorizeOrder(Request $request)
    {
        $request->validate([
            'paypal_order_id' => 'required|string',
            'order_number' => 'required|string|exists:orders,order_number',
        ]);

        $authRes = $this->paypalService->authorizeOrder($request->paypal_order_id);
        return response()->json($authRes);
    }

    /**
     * Get order details via Orders API v2 (GET /v2/checkout/orders/{id})
     */
    public function getOrderDetails(string $paypal_order_id)
    {
        $res = $this->paypalService->showOrderDetails($paypal_order_id);
        return response()->json($res);
    }

    /**
     * Get capture details via Payments API v2 (GET /v2/payments/captures/{id})
     */
    public function getCaptureDetails(string $capture_id)
    {
        $res = $this->paypalService->showCaptureDetails($capture_id);
        return response()->json($res);
    }

    /**
     * Admin Refund captured payment via Payments API v2 (POST /v2/payments/captures/{id}/refund)
     */
    public function refundOrder(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'nullable|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->payment_status !== 'paid' && $order->order_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Only paid orders can be refunded.',
            ], 400);
        }

        $payment = Payment::where('order_id', $order->id)->where('gateway', 'paypal')->first();

        // Extract capture ID from gateway response or transaction reference
        $captureId = null;
        if ($payment) {
            $raw = $payment->gateway_response;
            if (isset($raw['purchase_units'][0]['payments']['captures'][0]['id'])) {
                $captureId = $raw['purchase_units'][0]['payments']['captures'][0]['id'];
            } elseif (!empty($payment->transaction_reference)) {
                $captureId = $payment->transaction_reference;
            }
        }

        if (!$captureId) {
            $captureId = 'MOCK-CAP-' . Str::random(10);
        }

        $refundAmount = $request->amount ? floatval($request->amount) : floatval($order->total_amount);
        $refundRes = $this->paypalService->refundCapture($captureId, $refundAmount, null, $request->note);

        if (!$refundRes['success']) {
            return response()->json([
                'success' => false,
                'message' => $refundRes['message'] ?? 'PayPal refund failed.',
            ], 400);
        }

        // Update payment & order records
        if ($payment) {
            $payment->status = 'refunded';
            $payment->save();
        }

        $order->payment_status = 'refunded';
        $order->order_status = 'refunded';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'PayPal refund issued successfully.',
            'data' => [
                'order_number' => $order->order_number,
                'refund_id' => $refundRes['refund_id'] ?? null,
                'status' => $refundRes['status'] ?? 'COMPLETED',
                'amount' => $refundAmount,
            ]
        ]);
    }
}
