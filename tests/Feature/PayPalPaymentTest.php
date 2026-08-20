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
use Illuminate\Support\Str;
use Tests\TestCase;

class PayPalPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Ecommerce $ecommerce;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->ecommerce = Ecommerce::create([
            'name' => 'Dansolam Beauty Home',
            'slug' => 'dansolam-beauty-home',
            'domain' => 'dansolam.test',
            'email' => 'sales@dansolam.com',
            'currency' => 'USD',
            'is_active' => true,
        ]);

        EcommerceSetting::create(['ecommerce_id' => $this->ecommerce->id, 'key' => 'paypal_enabled', 'value' => 'true']);
        EcommerceSetting::create(['ecommerce_id' => $this->ecommerce->id, 'key' => 'paypal_mode', 'value' => 'sandbox']);
        EcommerceSetting::create(['ecommerce_id' => $this->ecommerce->id, 'key' => 'paypal_client_id', 'value' => 'mock_client_id']);
        EcommerceSetting::create(['ecommerce_id' => $this->ecommerce->id, 'key' => 'paypal_client_secret', 'value' => 'mock_client_secret']);
        EcommerceSetting::create(['ecommerce_id' => $this->ecommerce->id, 'key' => 'paypal_currency', 'value' => 'USD']);
        EcommerceSetting::create(['ecommerce_id' => $this->ecommerce->id, 'key' => 'paypal_exchange_rate', 'value' => '1.0']);

        $this->product = Product::create([
            'ecommerce_id' => $this->ecommerce->id,
            'name' => 'Designer Fashion Dress',
            'slug' => 'designer-fashion-dress',
            'sku' => 'DRESS-001',
            'price' => 150.00,
            'stock_quantity' => 10,
            'status' => 'published',
            'has_variants' => false,
        ]);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@dansolam.com',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
        ]);
    }

    public function test_paypal_service_instantiation_and_mock_mode()
    {
        $service = new PayPalService();
        $this->assertTrue($service->isEnabled());
        $this->assertTrue($service->isMockMode());
        $this->assertEquals('USD', $service->getDefaultCurrency());
        $this->assertEquals(1.0, $service->getExchangeRate());
    }

    public function test_paypal_create_order_service()
    {
        $service = new PayPalService();
        $res = $service->createOrder('ORD-TEST-001', 150.00, 'USD');

        $this->assertTrue($res['success']);
        $this->assertTrue($res['mock']);
        $this->assertStringStartsWith('MOCK-PAYPAL-', $res['paypal_order_id']);
        $this->assertEquals('CREATED', $res['status']);
        $this->assertNotNull($res['approve_url']);
    }

    public function test_paypal_capture_order_service()
    {
        $service = new PayPalService();
        $res = $service->captureOrder('MOCK-PAYPAL-12345');

        $this->assertTrue($res['success']);
        $this->assertTrue($res['mock']);
        $this->assertEquals('COMPLETED', $res['status']);
        $this->assertStringStartsWith('MOCK-CAP-', $res['capture_id']);
    }

    public function test_storefront_checkout_with_paypal()
    {
        $response = $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+234800000000',
            'delivery_address' => '123 Fashion Street',
            'delivery_city' => 'Abuja',
            'delivery_state' => 'FCT',
            'delivery_country' => 'Nigeria',
            'delivery_method' => 'pickup',
            'payment_method' => 'paypal',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                ]
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('orders', [
            'customer_email' => 'jane@example.com',
            'payment_method' => 'paypal',
            'payment_status' => 'pending',
        ]);
    }

    public function test_paypal_create_order_endpoint()
    {
        $order = Order::create([
            'ecommerce_id' => $this->ecommerce->id,
            'order_number' => 'ORD-PP-' . Str::random(5),
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+234800000000',
            'delivery_address' => '123 Street',
            'delivery_city' => 'Abuja',
            'delivery_state' => 'FCT',
            'delivery_country' => 'Nigeria',
            'subtotal' => 150.00,
            'total_amount' => 150.00,
            'payment_method' => 'paypal',
            'payment_status' => 'pending',
            'order_status' => 'pending_payment',
            'delivery_method' => 'pickup',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 150.00,
            'quantity' => 1,
        ]);

        $response = $this->postJson('/api/paypal/create-order', [
            'order_number' => $order->order_number,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.order_number', $order->order_number);
        $this->assertNotNull($response->json('data.paypal_order_id'));

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'gateway' => 'paypal',
            'status' => 'pending',
        ]);
    }

    public function test_paypal_capture_order_endpoint()
    {
        $order = Order::create([
            'ecommerce_id' => $this->ecommerce->id,
            'order_number' => 'ORD-CAP-' . Str::random(5),
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+234800000000',
            'delivery_address' => '123 Street',
            'delivery_city' => 'Abuja',
            'delivery_state' => 'FCT',
            'delivery_country' => 'Nigeria',
            'subtotal' => 150.00,
            'total_amount' => 150.00,
            'payment_method' => 'paypal',
            'payment_status' => 'pending',
            'order_status' => 'pending_payment',
            'delivery_method' => 'pickup',
        ]);

        $mockPaypalOrderId = 'MOCK-PAYPAL-' . Str::random(8);

        $response = $this->postJson('/api/paypal/capture-order', [
            'paypal_order_id' => $mockPaypalOrderId,
            'order_number' => $order->order_number,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.order_number', $order->order_number);

        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('paid', $order->order_status);
        $this->assertNotNull($order->paid_at);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'gateway' => 'paypal',
            'status' => 'success',
        ]);
    }

    public function test_admin_paypal_refund_endpoint()
    {
        $order = Order::create([
            'ecommerce_id' => $this->ecommerce->id,
            'order_number' => 'ORD-REF-' . Str::random(5),
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+234800000000',
            'delivery_address' => '123 Street',
            'delivery_city' => 'Abuja',
            'delivery_state' => 'FCT',
            'delivery_country' => 'Nigeria',
            'subtotal' => 150.00,
            'total_amount' => 150.00,
            'payment_method' => 'paypal',
            'payment_status' => 'paid',
            'order_status' => 'paid',
            'delivery_method' => 'pickup',
            'paid_at' => now(),
        ]);

        Payment::create([
            'order_id' => $order->id,
            'transaction_reference' => 'MOCK-CAP-9999',
            'gateway' => 'paypal',
            'amount' => 150.00,
            'status' => 'success',
            'gateway_response' => ['status' => 'COMPLETED'],
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/admin/paypal/refund', [
                'order_id' => $order->id,
                'amount' => 150.00,
                'note' => 'Customer requested full refund',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $order->refresh();
        $this->assertEquals('refunded', $order->payment_status);
        $this->assertEquals('refunded', $order->order_status);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'gateway' => 'paypal',
            'status' => 'refunded',
        ]);
    }
}
