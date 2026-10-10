<?php

namespace Tests\Feature;

use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Services\PayPalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class PayPalPaymentTest extends TestCase
{
    use RefreshDatabase;

    private const API = 'https://api-m.sandbox.paypal.com';

    protected Ecommerce $ecommerce;
    protected Product $product;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.payments.allow_simulation' => true]);

        // A migration seeds the store row; PayPalService reads settings from Ecommerce::first().
        $this->ecommerce = Ecommerce::first() ?? Ecommerce::create([
            'name' => 'Dansolam',
            'slug' => 'dansolam',
            'domain' => 'dansolam.test',
            'email' => 'info@dansolam.com',
            'currency' => 'USD',
            'is_active' => true,
        ]);

        $this->setting('paypal_enabled', 'true');
        $this->setting('paypal_mode', 'sandbox');
        $this->setting('system_currency_code', 'USD');
        $this->setting('paypal_currency', 'USD');

        $this->seed(\Database\Seeders\ShippingRulesSeeder::class);

        $this->product = Product::create([
            'ecommerce_id' => $this->ecommerce->id,
            'name' => 'Glowing Body Cream',
            'slug' => 'glowing-body-cream',
            'sku' => 'GBC-001',
            'price' => 150.00,
            'stock_quantity' => 10,
            'status' => 'published',
            'has_variants' => false,
        ]);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@dansolam.com',
            'password' => bcrypt('password'),
        ]);
    }

    // ------------------------------------------------------------------ helpers

    private function setting(string $key, string $value): void
    {
        EcommerceSetting::updateOrCreate(['ecommerce_id' => $this->ecommerce->id, 'key' => $key], ['value' => $value]);
    }

    private function useRealCredentials(): void
    {
        $this->setting('paypal_client_id', 'real-client-id');
        $this->setting('paypal_client_secret', 'real-client-secret');
        $this->setting('paypal_webhook_id', 'WH-123');
    }

    private function makeOrder(float $total = 150.00, array $overrides = []): Order
    {
        $order = Order::create(array_merge([
            'ecommerce_id' => $this->ecommerce->id,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+2348000000000',
            'delivery_address' => '1 Street',
            'delivery_city' => 'Lagos',
            'delivery_state' => 'Lagos',
            'delivery_country' => 'Nigeria',
            'subtotal' => $total,
            'total_amount' => $total,
            'payment_method' => 'paypal',
            'payment_status' => 'pending',
            'order_status' => 'pending_payment',
            'delivery_method' => 'pickup',
        ], $overrides));

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => $total,
            'quantity' => 1,
        ]);

        return $order;
    }

    private function createPayPalOrder(Order $order): string
    {
        return $this->postJson('/api/paypal/create-order', ['order_number' => $order->order_number])
            ->assertOk()
            ->json('data.paypal_order_id');
    }

    private function captureResponse(string $orderId, string $status, string $amount, string $currency = 'USD', ?string $customId = null): array
    {
        return [
            'id' => $orderId,
            'status' => 'COMPLETED',
            'purchase_units' => [[
                'payments' => ['captures' => [[
                    'id' => 'CAP-' . $orderId,
                    'status' => $status,
                    'amount' => ['currency_code' => $currency, 'value' => $amount],
                    'custom_id' => $customId,
                ]]],
            ]],
        ];
    }

    private function fakePayPal(array $routes): void
    {
        Http::fake(array_merge([
            self::API . '/v1/oauth2/token' => Http::response(['access_token' => 'token', 'expires_in' => 3600]),
        ], $routes));
    }

    // ------------------------------------------------------------ configuration

    public function test_mock_mode_only_exists_when_simulation_is_allowed(): void
    {
        $this->assertTrue((new PayPalService())->isMockMode());

        config(['services.payments.allow_simulation' => false]);
        $service = new PayPalService();
        $this->assertFalse($service->isMockMode());
        $this->assertNotNull($service->getConfigError());
        $this->assertFalse($service->createOrder('ORD-1', 10)['success']);
    }

    public function test_checkout_refuses_paypal_in_production_without_credentials(): void
    {
        config(['services.payments.allow_simulation' => false]);

        $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+2348000000000',
            'delivery_address' => '1 Street',
            'delivery_city' => 'Lagos',
            'delivery_state' => 'Lagos',
            'delivery_country' => 'Nigeria',
            'shipping_rate_id' => \App\Models\ShippingRate::where('name', 'Pick Up')->value('id'),
            'payment_method' => 'paypal',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertStatus(422);

        $this->assertSame(10, $this->product->fresh()->stock_quantity);
    }

    public function test_live_site_refuses_sandbox_payments(): void
    {
        // Sandbox keys on the live site: PayPal's test system would "approve" real
        // cards without charging them, so checkout must not offer it.
        config(['services.payments.allow_simulation' => false, 'services.payments.allow_sandbox' => false]);
        $this->useRealCredentials();
        $paypal = new \App\Services\PayPalService();

        $this->assertNotNull($paypal->getConfigError());
        $this->assertFalse($paypal->getClientConfig()['enabled']);

        $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'customer_phone' => '+447700900000',
            'delivery_address' => '1 Street', 'delivery_city' => 'London', 'delivery_state' => 'London', 'delivery_country' => 'United Kingdom',
            'shipping_rate_id' => \App\Models\ShippingRate::where('name', 'Pick Up')->value('id'),
            'payment_method' => 'paypal',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertStatus(422);
        $this->assertSame(0, Order::count());
    }

    public function test_live_mode_is_offered_on_the_live_site(): void
    {
        config(['services.payments.allow_simulation' => false, 'services.payments.allow_sandbox' => false]);
        $this->useRealCredentials();
        $this->setting('paypal_mode', 'live');

        $paypal = new \App\Services\PayPalService();
        $this->assertNull($paypal->getConfigError());
        $this->assertSame('live', $paypal->getClientConfig()['mode']);
    }

    public function test_sandbox_can_be_allowed_for_a_deliberate_test(): void
    {
        config(['services.payments.allow_simulation' => false, 'services.payments.allow_sandbox' => true]);
        $this->useRealCredentials();

        $this->assertNull((new \App\Services\PayPalService())->getConfigError());
    }

    public function test_unsupported_currency_is_rejected(): void
    {
        $this->setting('system_currency_code', 'NGN');
        $this->setting('paypal_currency', 'NGN');

        $this->assertStringContainsString('does not accept NGN', (new PayPalService())->getConfigError());
    }

    public function test_exchange_rate_converts_the_charge(): void
    {
        $this->setting('system_currency_code', 'NGN');
        $this->setting('paypal_currency', 'GBP');
        $this->setting('paypal_exchange_rate', '0.0005');

        $order = $this->makeOrder(20000);
        $this->postJson('/api/paypal/create-order', ['order_number' => $order->order_number])
            ->assertOk()
            ->assertJsonPath('data.amount', 10)
            ->assertJsonPath('data.currency', 'GBP');
    }

    // --------------------------------------------------------- simulated flow

    public function test_full_checkout_create_and_capture_flow(): void
    {
        $checkout = $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+2348000000000',
            'delivery_address' => '1 Street',
            'delivery_city' => 'Lagos',
            'delivery_state' => 'Lagos',
            'delivery_country' => 'Nigeria',
            'shipping_rate_id' => \App\Models\ShippingRate::where('name', 'Pick Up')->value('id'),
            'payment_method' => 'paypal',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertOk();

        $order = Order::where('order_number', $checkout->json('data.order_number'))->firstOrFail();
        $paypalOrderId = $this->createPayPalOrder($order);

        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => $paypalOrderId, 'order_number' => $order->order_number])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_status', 'paid');

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertNotNull($order->paid_at);

        // Returning twice is harmless.
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => $paypalOrderId, 'order_number' => $order->order_number])
            ->assertOk()->assertJsonPath('data.payment_status', 'paid');
    }

    // ---------------------------------------------------------------- exploits

    public function test_capture_rejects_a_paypal_order_that_was_never_created_for_this_order(): void
    {
        $order = $this->makeOrder();
        $this->createPayPalOrder($order);

        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'MOCK-PAYPAL-FORGED', 'order_number' => $order->order_number])
            ->assertStatus(422);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_capture_rejects_a_paypal_order_from_another_store_order(): void
    {
        $cheap = $this->makeOrder(1.00);
        $expensive = $this->makeOrder(500.00);
        $cheapPayPalId = $this->createPayPalOrder($cheap);
        $this->createPayPalOrder($expensive);

        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => $cheapPayPalId, 'order_number' => $expensive->order_number])
            ->assertStatus(422);

        $this->assertSame('pending', $expensive->fresh()->payment_status);
    }

    public function test_generic_verify_endpoint_cannot_mark_a_paypal_order_paid(): void
    {
        $order = $this->makeOrder();

        $this->postJson('/api/payment/verify', ['order_number' => $order->order_number, 'reference' => 'mock-ref'])
            ->assertStatus(422);
        $this->postJson('/api/payment/verify', ['order_number' => $order->order_number, 'reference' => 'mock-ref', 'gateway' => 'stripe'])
            ->assertStatus(422);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_generic_verify_endpoint_refuses_mock_references_in_production(): void
    {
        config(['services.payments.allow_simulation' => false]);
        $this->setting('paystack_key_secret', 'sk_live_real');
        Http::fake(['api.paystack.co/*' => Http::response(['status' => false], 400)]);

        $order = $this->makeOrder(150, ['payment_method' => 'paystack']);

        $this->postJson('/api/payment/verify', ['order_number' => $order->order_number, 'reference' => 'mock-anything'])
            ->assertJsonPath('success', false);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    // --------------------------------------------------------- real API (faked)

    public function test_real_capture_marks_order_paid_when_amount_matches(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-1', 'status' => 'CREATED', 'links' => [['rel' => 'payer-action', 'href' => 'https://paypal.test/approve']]], 201),
            self::API . '/v2/checkout/orders/PP-1/capture' => Http::response($this->captureResponse('PP-1', 'COMPLETED', '150.00', 'USD', $order->order_number), 201),
        ]);

        $this->postJson('/api/paypal/create-order', ['order_number' => $order->order_number])
            ->assertOk()->assertJsonPath('data.approve_url', 'https://paypal.test/approve');

        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'PP-1', 'order_number' => $order->order_number])
            ->assertOk()->assertJsonPath('data.capture_id', 'CAP-PP-1');

        $this->assertSame('paid', $order->fresh()->payment_status);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/capture') && $request->hasHeader('PayPal-Request-Id', 'capture-PP-1'));
    }

    public function test_unpaid_order_can_be_paid_later_from_the_pay_page(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-LATER', 'status' => 'CREATED', 'links' => [['rel' => 'payer-action', 'href' => 'https://paypal.test/approve']]], 201),
            self::API . '/v2/checkout/orders/PP-LATER/capture' => Http::response($this->captureResponse('PP-LATER', 'COMPLETED', '150.00', 'USD', $order->order_number), 201),
        ]);

        $this->postJson('/api/paypal/create-order', ['order_number' => $order->order_number, 'return_to' => 'pay'])->assertOk();

        // PayPal is told to send the customer back to the pay page, not to checkout.
        Http::assertSent(function ($request) use ($order) {
            if (!str_ends_with($request->url(), '/v2/checkout/orders')) return false;
            $context = $request['payment_source']['paypal']['experience_context'] ?? $request['application_context'] ?? [];
            return str_contains(json_encode($context, JSON_UNESCAPED_SLASHES), '/pay/' . $order->order_number . '?paypal_return=true');
        });

        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'PP-LATER', 'order_number' => $order->order_number])
            ->assertOk()->assertJsonPath('data.payment_status', 'paid');
        $this->assertSame('paid', $order->fresh()->payment_status);

        // Once paid, it cannot be paid again.
        $this->postJson('/api/paypal/create-order', ['order_number' => $order->order_number, 'return_to' => 'pay'])->assertStatus(400);
    }

    public function test_real_capture_with_wrong_amount_is_not_marked_paid(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-2', 'status' => 'CREATED', 'links' => []], 201),
            self::API . '/v2/checkout/orders/PP-2/capture' => Http::response($this->captureResponse('PP-2', 'COMPLETED', '1.00'), 201),
        ]);

        $this->createPayPalOrder($order);
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'PP-2', 'order_number' => $order->order_number])
            ->assertStatus(409);

        $this->assertSame('pending', $order->fresh()->payment_status);
        $this->assertSame('review', Payment::where('order_id', $order->id)->value('status'));
    }

    public function test_already_captured_order_is_verified_via_order_lookup(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-3', 'status' => 'CREATED', 'links' => []], 201),
            self::API . '/v2/checkout/orders/PP-3/capture' => Http::response(['name' => 'UNPROCESSABLE_ENTITY', 'details' => [['issue' => 'ORDER_ALREADY_CAPTURED']]], 422),
            self::API . '/v2/checkout/orders/PP-3' => Http::response($this->captureResponse('PP-3', 'COMPLETED', '150.00')),
        ]);

        $this->createPayPalOrder($order);
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'PP-3', 'order_number' => $order->order_number])
            ->assertOk();

        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_pending_capture_waits_for_paypal_review(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-4', 'status' => 'CREATED', 'links' => []], 201),
            self::API . '/v2/checkout/orders/PP-4/capture' => Http::response($this->captureResponse('PP-4', 'PENDING', '150.00'), 201),
        ]);

        $this->createPayPalOrder($order);
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'PP-4', 'order_number' => $order->order_number])
            ->assertOk()->assertJsonPath('data.pending', true);

        $this->assertSame('pending', $order->fresh()->payment_status);
        $this->assertSame('pending_review', Payment::where('order_id', $order->id)->value('status'));
    }

    public function test_declined_capture_reports_failure(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-5', 'status' => 'CREATED', 'links' => []], 201),
            self::API . '/v2/checkout/orders/PP-5/capture' => Http::response(['name' => 'UNPROCESSABLE_ENTITY', 'details' => [['issue' => 'INSTRUMENT_DECLINED']]], 422),
        ]);

        $this->createPayPalOrder($order);
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => 'PP-5', 'order_number' => $order->order_number])
            ->assertStatus(402)->assertJsonPath('success', false);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    // ------------------------------------------------------------- authorize

    public function test_authorize_intent_holds_funds_then_admin_captures(): void
    {
        $this->setting('paypal_intent', 'AUTHORIZE');
        $order = $this->makeOrder(150);
        $paypalOrderId = $this->createPayPalOrder($order);

        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => $paypalOrderId, 'order_number' => $order->order_number])
            ->assertOk()->assertJsonPath('data.payment_status', 'authorized');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/paypal/capture-authorization', ['order_id' => $order->id])
            ->assertOk();

        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_admin_can_void_an_authorization(): void
    {
        $this->setting('paypal_intent', 'AUTHORIZE');
        $order = $this->makeOrder(150);
        $paypalOrderId = $this->createPayPalOrder($order);
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => $paypalOrderId, 'order_number' => $order->order_number])->assertOk();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/paypal/void-authorization', ['order_id' => $order->id])
            ->assertOk();

        $this->assertSame('voided', $order->fresh()->payment_status);
    }

    // ---------------------------------------------------------------- refunds

    public function test_partial_then_full_refund(): void
    {
        $order = $this->makeOrder(150);
        $paypalOrderId = $this->createPayPalOrder($order);
        $this->postJson('/api/paypal/capture-order', ['paypal_order_id' => $paypalOrderId, 'order_number' => $order->order_number])->assertOk();

        $admin = $this->actingAs($this->admin, 'sanctum');

        $admin->postJson('/api/admin/paypal/refund', ['order_id' => $order->id, 'amount' => 50])->assertOk();
        $this->assertSame('partially_refunded', $order->fresh()->payment_status);

        $admin->postJson('/api/admin/paypal/refund', ['order_id' => $order->id, 'amount' => 200])->assertStatus(422);

        $admin->postJson('/api/admin/paypal/refund', ['order_id' => $order->id])->assertOk();
        $order->refresh();
        $this->assertSame('refunded', $order->payment_status);
        $this->assertSame('refunded', $order->order_status);
    }

    public function test_refund_requires_a_captured_payment(): void
    {
        $order = $this->makeOrder(150, ['payment_status' => 'paid', 'order_status' => 'paid']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/paypal/refund', ['order_id' => $order->id])
            ->assertStatus(400);
    }

    // ---------------------------------------------------------------- webhook

    public function test_webhook_with_bad_signature_is_rejected(): void
    {
        $this->useRealCredentials();
        $this->fakePayPal([
            self::API . '/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'FAILURE']),
        ]);

        $this->postJson('/api/paypal/webhook', ['event_type' => 'CHECKOUT.ORDER.APPROVED', 'resource' => []])
            ->assertStatus(400);
    }

    public function test_webhook_settles_an_approved_order_the_buyer_never_returned_from(): void
    {
        $this->useRealCredentials();
        $order = $this->makeOrder(150);

        $this->fakePayPal([
            self::API . '/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'SUCCESS']),
            self::API . '/v2/checkout/orders' => Http::response(['id' => 'PP-9', 'status' => 'CREATED', 'links' => []], 201),
            self::API . '/v2/checkout/orders/PP-9/capture' => Http::response($this->captureResponse('PP-9', 'COMPLETED', '150.00'), 201),
        ]);

        $this->createPayPalOrder($order);

        $this->postJson('/api/paypal/webhook', [
            'event_type' => 'CHECKOUT.ORDER.APPROVED',
            'resource' => ['id' => 'PP-9', 'purchase_units' => [['custom_id' => $order->order_number]]],
        ])->assertOk();

        $this->assertSame('paid', $order->fresh()->payment_status);
    }
}
