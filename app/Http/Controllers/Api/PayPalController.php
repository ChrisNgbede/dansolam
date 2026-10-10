<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderInvoiceMail;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * PayPal checkout flow:
 *   1. createOrder   — PayPal order created for a store order; what we expect to be
 *                      paid (PayPal order id, amount, currency, intent) is stored on the Payment.
 *   2. buyer approves on PayPal (redirect) or in the inline card fields.
 *   3. captureOrder  — called by the storefront on return; the webhook does the same
 *                      if the buyer never comes back. Both go through settle(), which
 *                      only marks the order paid after checking PayPal's answer
 *                      against the stored expectation.
 */
class PayPalController extends Controller
{
    public function __construct(protected PayPalService $paypalService)
    {
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

    public function createOrder(Request $request)
    {
        $request->validate([
            'order_number' => 'required|string|exists:orders,order_number',
            'return_to' => 'nullable|in:checkout,pay',
            // 'sdk': paid with PayPal's on-page buttons (card form / PayPal popup).
            'flow' => 'nullable|in:redirect,sdk',
        ]);

        $order = Order::with('items')->where('order_number', $request->order_number)->firstOrFail();

        if ($order->payment_method !== 'paypal') {
            return response()->json(['success' => false, 'message' => 'This order is not set up for PayPal payment.'], 422);
        }
        if (in_array($order->payment_status, ['paid', 'authorized', 'refunded', 'partially_refunded'], true)) {
            return response()->json(['success' => false, 'message' => 'This order has already been paid.'], 400);
        }

        $items = $order->items->map(fn ($item) => [
            'product_name' => $item->product_name,
            'price' => (float) $item->price,
            'quantity' => (int) $item->quantity,
        ])->all();

        $result = $this->paypalService->createOrder(
            $order->order_number,
            (float) $order->total_amount,
            null,
            $items,
            // Paying later from the order page comes back there; checkout comes back to checkout.
            $request->return_to === 'pay'
                ? url('/pay/' . rawurlencode($order->order_number) . '?paypal_return=true')
                : url("/checkout?paypal_return=true&order_number={$order->order_number}"),
            $request->return_to === 'pay'
                ? url('/pay/' . rawurlencode($order->order_number) . '?paypal_cancel=true')
                : url('/checkout?paypal_cancel=true&order_number=' . $order->order_number),
            $request->flow === 'sdk',
            $request->flow === 'sdk' ? PayPalService::payerFromOrder($order) : null
        );

        if (!$result['success'] || empty($result['paypal_order_id'])) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to initialize PayPal order.',
            ], 502);
        }

        Payment::updateOrCreate(
            ['order_id' => $order->id, 'gateway' => 'paypal'],
            [
                'transaction_reference' => $result['paypal_order_id'],
                'amount' => $order->total_amount,
                'status' => 'pending',
                'gateway_response' => [
                    'expected' => [
                        'paypal_order_id' => $result['paypal_order_id'],
                        'amount' => $result['amount'],
                        'currency' => $result['currency'],
                        'intent' => $this->paypalService->getIntent(),
                        'mock' => $result['mock'] ?? false,
                    ],
                    'create' => $result['raw'] ?? [],
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'PayPal order initialized successfully.',
            'data' => [
                'paypal_order_id' => $result['paypal_order_id'],
                'approve_url' => $result['approve_url'],
                'order_number' => $order->order_number,
                'amount' => $result['amount'],
                'currency' => $result['currency'],
                'intent' => $this->paypalService->getIntent(),
                'mock' => $result['mock'] ?? false,
            ],
        ]);
    }

    /**
     * Capture (or authorize, for intent AUTHORIZE) an approved PayPal order.
     */
    public function captureOrder(Request $request)
    {
        $request->validate([
            'paypal_order_id' => 'required|string|max:64',
            'order_number' => 'required|string|exists:orders,order_number',
        ]);

        $order = Order::where('order_number', $request->order_number)->firstOrFail();
        $result = $this->settle($order, $request->paypal_order_id);

        return response()->json($result['body'], $result['status']);
    }

    /**
     * Kept for API compatibility: the authorize step now runs inside captureOrder
     * whenever the store's intent is AUTHORIZE.
     */
    public function authorizeOrder(Request $request)
    {
        return $this->captureOrder($request);
    }

    /**
     * Verify PayPal's answer against what this order expects, then record it.
     *
     * @return array{status:int, body:array}
     */
    private function settle(Order $order, string $paypalOrderId): array
    {
        $outcome = DB::transaction(function () use ($order, $paypalOrderId) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();
            $payment = Payment::where('order_id', $order->id)->where('gateway', 'paypal')->lockForUpdate()->first();
            $expected = $payment?->gateway_response['expected'] ?? null;

            if (!$expected || ($expected['paypal_order_id'] ?? null) !== $paypalOrderId) {
                Log::warning('PayPal settle rejected: PayPal order does not belong to store order', [
                    'order' => $order->order_number,
                    'paypal_order_id' => $paypalOrderId,
                ]);
                return $this->fail(422, 'This PayPal payment does not belong to this order.');
            }

            // Already settled (buyer returned twice, or webhook got there first).
            if (in_array($order->payment_status, ['paid', 'authorized'], true)) {
                return ['status' => 200, 'body' => $this->successBody($order, $payment, false)];
            }

            $simulate = [
                'amount' => $expected['amount'],
                'currency' => $expected['currency'],
                'custom_id' => $order->order_number,
            ];
            $isAuthorize = ($expected['intent'] ?? 'CAPTURE') === 'AUTHORIZE';
            $result = $isAuthorize
                ? $this->paypalService->authorizeOrder($paypalOrderId, $simulate)
                : $this->paypalService->captureOrder($paypalOrderId, $simulate);

            if (!empty($result['mock']) && empty($expected['mock'])) {
                // Never settle a real PayPal order with a simulated result.
                return $this->fail(409, 'PayPal is not available right now. Please try again shortly.');
            }

            if (!$result['success']) {
                $payment->status = 'failed';
                $payment->gateway_response = array_merge($payment->gateway_response ?? [], ['last_error' => $result['raw'] ?? $result['message'] ?? null]);
                $payment->save();
                return $this->fail(402, $result['message'] ?? 'PayPal payment was not completed.');
            }

            $amountOk = isset($result['amount']) && abs((float) $result['amount'] - (float) $expected['amount']) < 0.01;
            $currencyOk = strtoupper((string) ($result['currency'] ?? '')) === strtoupper($expected['currency']);
            $referenceOk = empty($result['custom_id']) || $result['custom_id'] === $order->order_number;

            if (!$amountOk || !$currencyOk || !$referenceOk) {
                Log::critical('PayPal payment does not match order', [
                    'order' => $order->order_number,
                    'expected' => $expected,
                    'received' => ['amount' => $result['amount'] ?? null, 'currency' => $result['currency'] ?? null, 'custom_id' => $result['custom_id'] ?? null],
                ]);
                $payment->status = 'review';
                $payment->gateway_response = array_merge($payment->gateway_response ?? [], ['mismatch' => $result['raw'] ?? []]);
                $payment->save();
                return $this->fail(409, 'We received your PayPal payment but it did not match this order. Our team will contact you.');
            }

            $reference = $result[$isAuthorize ? 'authorization_id' : 'capture_id'] ?? $paypalOrderId;
            $payment->transaction_reference = $reference;
            $payment->gateway_response = array_merge($payment->gateway_response ?? [], [
                $isAuthorize ? 'authorization' : 'capture' => [
                    'id' => $reference,
                    'status' => $result['status'],
                    'amount' => $result['amount'],
                    'currency' => $result['currency'],
                    'payer' => $result['payer'] ?? null,
                ],
                'result' => $result['raw'] ?? [],
            ]);

            $newlyPaid = false;
            if ($isAuthorize) {
                $payment->status = 'authorized';
                $order->payment_status = 'authorized';
                $order->order_status = 'processing';
            } elseif (!empty($result['pending'])) {
                // PayPal is still reviewing; the webhook will confirm it later.
                $payment->status = 'pending_review';
            } else {
                $payment->status = 'success';
                $order->payment_status = 'paid';
                $order->order_status = 'paid';
                $order->paid_at = now();
                $newlyPaid = true;
            }

            $payment->save();
            $order->save();

            return ['status' => 200, 'body' => $this->successBody($order, $payment, !empty($result['pending'])), 'notify' => $newlyPaid ? $order : null];
        });

        if (!empty($outcome['notify'])) {
            $this->sendPaidEmail($outcome['notify']);
        }

        return $outcome;
    }

    private function successBody(Order $order, Payment $payment, bool $pending): array
    {
        $details = $payment->gateway_response['capture'] ?? $payment->gateway_response['authorization'] ?? [];

        return [
            'success' => true,
            'message' => match (true) {
                $pending => 'Your PayPal payment is being reviewed by PayPal. We will confirm your order as soon as it clears.',
                $order->payment_status === 'authorized' => 'Payment authorized. It will be collected when your order is dispatched.',
                default => 'PayPal payment captured successfully!',
            },
            'data' => [
                'order_number' => $order->order_number,
                'payment_status' => $order->payment_status,
                'pending' => $pending,
                'capture_id' => $payment->gateway_response['capture']['id'] ?? null,
                'authorization_id' => $payment->gateway_response['authorization']['id'] ?? null,
                'status' => $details['status'] ?? null,
                'payer' => $details['payer'] ?? null,
            ],
        ];
    }

    private function fail(int $status, string $message): array
    {
        return ['status' => $status, 'body' => ['success' => false, 'message' => $message]];
    }

    private function sendPaidEmail(Order $order): void
    {
        try {
            if (!empty($order->customer_email)) {
                Mail::to($order->customer_email)->send(new OrderInvoiceMail($order, 'payment_success'));
            }
        } catch (\Throwable $e) {
            Log::warning('PayPal payment email failed: ' . $e->getMessage());
        }

        \App\Services\StoreMailer::paymentReceived($order, 'paypal');
    }

    // ---------------------------------------------------------------------
    // Webhook
    // ---------------------------------------------------------------------

    /**
     * PayPal webhook. Configure in the PayPal developer dashboard to point at
     * /api/paypal/webhook and paste the webhook id into Admin → Settings.
     */
    public function webhook(Request $request)
    {
        $raw = $request->getContent();
        if (!$this->paypalService->verifyWebhookSignature($request->headers->all(), $raw)) {
            Log::warning('PayPal webhook rejected: signature verification failed');
            return response()->json(['success' => false], 400);
        }

        $event = json_decode($raw, true);
        $type = $event['event_type'] ?? '';
        $resource = $event['resource'] ?? [];

        try {
            match ($type) {
                // Buyer approved but never returned to the site: settle it for them.
                'CHECKOUT.ORDER.APPROVED' => $this->settleFromWebhook(
                    $resource['id'] ?? null,
                    $resource['purchase_units'][0]['custom_id'] ?? $resource['purchase_units'][0]['reference_id'] ?? null
                ),
                // A capture that was PENDING has now cleared (or a capture we missed).
                'PAYMENT.CAPTURE.COMPLETED' => $this->settleFromWebhook(
                    $resource['supplementary_data']['related_ids']['order_id'] ?? null,
                    $resource['custom_id'] ?? null
                ),
                'PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED' => $this->markCaptureFailed($resource),
                'PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED' => $this->markCaptureRefunded($type, $resource),
                default => null,
            };
        } catch (\Throwable $e) {
            Log::error("PayPal webhook {$type} failed: " . $e->getMessage());
            return response()->json(['success' => false], 500); // PayPal retries.
        }

        return response()->json(['success' => true]);
    }

    private function settleFromWebhook(?string $paypalOrderId, ?string $orderNumber): void
    {
        if (!$paypalOrderId || !$orderNumber) {
            return;
        }
        $order = Order::where('order_number', $orderNumber)->first();
        if ($order) {
            $result = $this->settle($order, $paypalOrderId);
            Log::info('PayPal webhook settle', ['order' => $orderNumber, 'status' => $result['status']]);
        }
    }

    private function paymentForCapture(?string $captureId): ?Payment
    {
        return $captureId ? Payment::where('gateway', 'paypal')->where('transaction_reference', $captureId)->first() : null;
    }

    private function markCaptureFailed(array $resource): void
    {
        $payment = $this->paymentForCapture($resource['id'] ?? null);
        if (!$payment) {
            return;
        }
        $payment->update(['status' => 'failed']);
        $payment->order?->update(['payment_status' => 'failed', 'order_status' => 'pending_payment']);
    }

    private function markCaptureRefunded(string $type, array $resource): void
    {
        // REFUNDED sends the refund (its "up" link points at the capture); REVERSED sends the capture.
        $captureId = $type === 'PAYMENT.CAPTURE.REVERSED'
            ? ($resource['id'] ?? null)
            : collect($resource['links'] ?? [])->first(fn ($l) => ($l['rel'] ?? '') === 'up')['href'] ?? null;
        if ($captureId && str_contains($captureId, '/')) {
            $captureId = basename($captureId);
        }

        $payment = $this->paymentForCapture($captureId);
        if (!$payment || $payment->status === 'refunded') {
            return;
        }

        $refundId = $type === 'PAYMENT.CAPTURE.REFUNDED' ? ($resource['id'] ?? null) : null;
        $response = $payment->gateway_response ?? [];
        if ($refundId && collect($response['refunds'] ?? [])->contains('id', $refundId)) {
            return; // Already recorded when the admin issued it.
        }

        $amount = (float) ($resource['amount']['value'] ?? 0);
        $this->recordRefund($payment, $refundId ?? ('reversal-' . $captureId), $amount, $type === 'PAYMENT.CAPTURE.REVERSED' ? 'reversal' : 'webhook');
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    public function getOrderDetails(string $paypal_order_id)
    {
        return response()->json($this->paypalService->showOrderDetails($paypal_order_id));
    }

    public function getCaptureDetails(string $capture_id)
    {
        return response()->json($this->paypalService->showCaptureDetails($capture_id));
    }

    /**
     * Refund all or part of a captured payment. `amount` is in the store currency.
     */
    public function refundOrder(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'nullable|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            $order = Order::whereKey($request->order_id)->lockForUpdate()->firstOrFail();
            $payment = Payment::where('order_id', $order->id)->where('gateway', 'paypal')->lockForUpdate()->first();
            $capture = $payment?->gateway_response['capture'] ?? null;

            if (!$payment || !$capture || !in_array($payment->status, ['success', 'partially_refunded'], true)) {
                return response()->json(['success' => false, 'message' => 'Only captured PayPal payments can be refunded.'], 400);
            }

            $captured = (float) $capture['amount'];
            $alreadyRefunded = (float) collect($payment->gateway_response['refunds'] ?? [])->sum('amount');
            $refundable = round($captured - $alreadyRefunded, 2);

            // Admin enters store-currency amounts; PayPal refunds in the capture currency.
            $amount = $request->filled('amount')
                ? $this->paypalService->convertAmount((float) $request->amount)
                : $refundable;

            if ($amount <= 0 || $amount - $refundable > 0.009) {
                return response()->json([
                    'success' => false,
                    'message' => "Refund exceeds the refundable balance ({$capture['currency']} " . number_format($refundable, 2) . ').',
                ], 422);
            }

            $isFull = abs($amount - $refundable) < 0.01;
            $result = $this->paypalService->refundCapture(
                $capture['id'],
                $isFull && $alreadyRefunded == 0.0 ? null : $amount,
                $capture['currency'],
                $request->note,
                'refund-' . $capture['id'] . '-' . (count($payment->gateway_response['refunds'] ?? []) + 1)
            );

            if (!$result['success']) {
                return response()->json(['success' => false, 'message' => $result['message'] ?? 'PayPal refund failed.'], 400);
            }

            $this->recordRefund($payment, $result['refund_id'], (float) ($result['amount'] ?? $amount), 'admin', $request->note);

            return response()->json([
                'success' => true,
                'message' => $isFull ? 'PayPal refund issued successfully.' : 'Partial PayPal refund issued successfully.',
                'data' => [
                    'order_number' => $order->order_number,
                    'refund_id' => $result['refund_id'] ?? null,
                    'status' => $result['status'] ?? 'COMPLETED',
                    'amount' => $amount,
                    'currency' => $capture['currency'],
                    'payment_status' => $payment->fresh()->order->payment_status,
                ],
            ]);
        });
    }

    private function recordRefund(Payment $payment, ?string $refundId, float $amount, string $source, ?string $note = null): void
    {
        $response = $payment->gateway_response ?? [];
        $response['refunds'][] = [
            'id' => $refundId,
            'amount' => $amount,
            'source' => $source,
            'note' => $note,
            'at' => now()->toIso8601String(),
        ];
        $refunded = (float) collect($response['refunds'])->sum('amount');
        $captured = (float) ($response['capture']['amount'] ?? $amount);
        $isFull = $refunded >= $captured - 0.009;

        $payment->gateway_response = $response;
        $payment->status = $isFull ? 'refunded' : 'partially_refunded';
        $payment->save();

        $payment->order?->update([
            'payment_status' => $isFull ? 'refunded' : 'partially_refunded',
            'order_status' => $isFull ? 'refunded' : $payment->order->order_status,
        ]);
    }

    /**
     * Collect funds from an authorized (held) payment.
     */
    public function captureAuthorization(Request $request)
    {
        $request->validate(['order_id' => 'required|exists:orders,id']);

        return DB::transaction(function () use ($request) {
            $order = Order::whereKey($request->order_id)->lockForUpdate()->firstOrFail();
            $payment = Payment::where('order_id', $order->id)->where('gateway', 'paypal')->lockForUpdate()->first();
            $auth = $payment?->gateway_response['authorization'] ?? null;

            if (!$payment || !$auth || $payment->status !== 'authorized') {
                return response()->json(['success' => false, 'message' => 'This order has no authorized PayPal payment to capture.'], 400);
            }

            $result = $this->paypalService->captureAuthorization($auth['id'], (float) $auth['amount'], $auth['currency']);
            if (!$result['success']) {
                return response()->json(['success' => false, 'message' => $result['message'] ?? 'Capture failed.'], 400);
            }

            $payment->transaction_reference = $result['capture_id'];
            $payment->status = $result['status'] === 'PENDING' ? 'pending_review' : 'success';
            $payment->gateway_response = array_merge($payment->gateway_response, [
                'capture' => ['id' => $result['capture_id'], 'status' => $result['status'], 'amount' => $result['amount'], 'currency' => $result['currency']],
            ]);
            $payment->save();

            if ($payment->status === 'success') {
                $order->update(['payment_status' => 'paid', 'paid_at' => now()]);
            }

            return response()->json(['success' => true, 'message' => 'Authorized payment captured.', 'data' => ['capture_id' => $result['capture_id'], 'status' => $result['status']]]);
        });
    }

    /**
     * Release an authorized (held) payment without charging the buyer.
     */
    public function voidAuthorization(Request $request)
    {
        $request->validate(['order_id' => 'required|exists:orders,id']);

        $payment = Payment::where('order_id', $request->order_id)->where('gateway', 'paypal')->first();
        $auth = $payment?->gateway_response['authorization'] ?? null;
        if (!$payment || !$auth || $payment->status !== 'authorized') {
            return response()->json(['success' => false, 'message' => 'This order has no authorized PayPal payment to void.'], 400);
        }

        $result = $this->paypalService->voidAuthorization($auth['id']);
        if (!$result['success']) {
            return response()->json(['success' => false, 'message' => $result['message'] ?? 'Void failed.'], 400);
        }

        $payment->update(['status' => 'voided']);
        $payment->order?->update(['payment_status' => 'voided', 'order_status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Authorization voided; the buyer has not been charged.']);
    }
}
