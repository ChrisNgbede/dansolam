<?php

namespace Tests\Feature;

use App\Models\Ecommerce;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingRate;
use App\Models\User;
use App\Services\ShippingCalculator;
use Database\Seeders\ShippingRulesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The shipping rules carried over from the old store, and that checkout charges them.
 */
class ShippingRulesTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $store = Ecommerce::first() ?? Ecommerce::create([
            'name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'info@dansolam.com', 'currency' => 'GBP', 'is_active' => true,
        ]);

        $this->product = Product::create([
            'ecommerce_id' => $store->id,
            'name' => 'Body Cream',
            'slug' => 'body-cream',
            'sku' => 'BC-1',
            'price' => 20,
            'stock_quantity' => 100,
            'status' => 'published',
            'has_variants' => false,
        ]);

        $this->seed(ShippingRulesSeeder::class);
    }

    private function names(string $country, int $qty): array
    {
        return app(ShippingCalculator::class)->eligible($country, $qty)->pluck('name')->all();
    }

    private function method(string $name): ShippingRate
    {
        return ShippingRate::where('name', $name)->firstOrFail();
    }

    private function checkout(string $country, int $qty, ShippingRate $method)
    {
        return $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+447700900000',
            'delivery_address' => '1 High Street',
            'delivery_city' => 'London', 'delivery_postcode' => 'SW1A 1AA',
            'delivery_state' => 'Greater London',
            'delivery_country' => $country,
            'payment_method' => 'bank_transfer',
            'shipping_rate_id' => $method->id,
            'items' => [['product_id' => $this->product->id, 'quantity' => $qty]],
        ]);
    }

    public function test_seeded_rules_match_the_old_store(): void
    {
        $active = ShippingRate::where('is_active', true)->orderBy('sort_order')->get(['name', 'zone', 'min_quantity', 'max_quantity', 'rate']);

        $this->assertSame([
            ['Uk Shipping (1-3 Items)', 'uk', 1, 3, '6.00'],
            ['Uk Shipping (4 Items and above)', 'uk', 4, null, '10.00'],
            ['International (1-2 Items)', 'international', 1, 2, '20.00'],
            ['International (3-4 Items)', 'international', 3, 4, '35.00'],
            ['International (5 Items and above)', 'international', 5, null, '50.00'],
            ['Pick Up', 'all', 1, null, '0.00'],
        ], $active->map(fn ($r) => [$r->name, $r->zone, $r->min_quantity, $r->max_quantity, $r->rate])->all());
    }

    public function test_uk_customers_see_uk_methods_by_quantity(): void
    {
        $this->assertSame(['Uk Shipping (1-3 Items)', 'Pick Up'], $this->names('United Kingdom', 1));
        $this->assertSame(['Uk Shipping (1-3 Items)', 'Pick Up'], $this->names('United Kingdom', 3));
        $this->assertSame(['Uk Shipping (4 Items and above)', 'Pick Up'], $this->names('United Kingdom', 4));
        $this->assertSame(['Uk Shipping (4 Items and above)', 'Pick Up'], $this->names('UK', 12));
    }

    public function test_international_customers_see_international_methods_by_quantity(): void
    {
        $this->assertSame(['International (1-2 Items)', 'Pick Up'], $this->names('Nigeria', 2));
        $this->assertSame(['International (3-4 Items)', 'Pick Up'], $this->names('United States', 3));
        $this->assertSame(['International (3-4 Items)', 'Pick Up'], $this->names('France', 4));
        $this->assertSame(['International (5 Items and above)', 'Pick Up'], $this->names('Canada', 5));
    }

    public function test_crown_dependencies_are_international(): void
    {
        foreach (['Jersey', 'Guernsey', 'Isle of Man'] as $country) {
            $this->assertSame(['International (1-2 Items)', 'Pick Up'], $this->names($country, 1), $country);
        }
    }

    public function test_checkout_charges_the_chosen_method(): void
    {
        $this->checkout('United Kingdom', 2, $this->method('Uk Shipping (1-3 Items)'))->assertOk();
        $order = Order::latest('id')->first();
        $this->assertEquals(6.00, (float) $order->delivery_fee);
        $this->assertEquals(46.00, (float) $order->total_amount); // 2 × £20 + £6
        $this->assertSame('delivery', $order->delivery_method);
    }

    public function test_international_order_is_charged_by_quantity_band(): void
    {
        $this->checkout('Nigeria', 5, $this->method('International (5 Items and above)'))->assertOk();
        $this->assertEquals(50.00, (float) Order::latest('id')->first()->delivery_fee);
    }

    public function test_pick_up_is_free_and_marked_as_pickup(): void
    {
        $this->checkout('United Kingdom', 1, $this->method('Pick Up'))->assertOk();
        $order = Order::latest('id')->first();
        $this->assertEquals(0.0, (float) $order->delivery_fee);
        $this->assertSame('pickup', $order->delivery_method);
    }

    public function test_a_method_that_does_not_apply_is_rejected(): void
    {
        // UK rate for an international address, and a 1-3 item rate for 6 items.
        $this->checkout('Nigeria', 1, $this->method('Uk Shipping (1-3 Items)'))->assertStatus(422);
        $this->checkout('United Kingdom', 6, $this->method('Uk Shipping (1-3 Items)'))->assertStatus(422);
        $this->assertSame(0, Order::count());
    }

    public function test_retired_methods_cannot_be_used(): void
    {
        $retired = ShippingRate::create([
            'name' => 'Old flat rate', 'zone' => 'all', 'rate' => 1, 'type' => 'flat', 'calculation_method' => 'flat',
            'applicability' => 'global', 'sales_channel' => 'storefront', 'is_active' => false, 'shipping_zone_type' => 'all',
        ]);

        $this->checkout('United Kingdom', 1, $retired)->assertStatus(422);
    }

    public function test_storefront_lists_only_active_methods(): void
    {
        $this->getJson('/api/shipping-rates')->assertOk()->assertJsonCount(6, 'data')
            ->assertJsonPath('data.0.name', 'Uk Shipping (1-3 Items)');
    }

    public function test_admin_can_manage_a_method(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $method = $this->method('Uk Shipping (1-3 Items)');

        $this->putJson("/api/admin/shipping-rates/{$method->id}", [
            'name' => 'Uk Shipping (1-3 Items)', 'rate' => 7.5, 'zone' => 'uk',
            'min_quantity' => 1, 'max_quantity' => 3, 'is_active' => true, 'is_default' => true, 'is_pickup' => false,
        ])->assertOk();

        $this->assertEquals(7.5, (float) $method->fresh()->rate);

        // Max below min is refused.
        $this->putJson("/api/admin/shipping-rates/{$method->id}", [
            'name' => 'Bad', 'rate' => 1, 'zone' => 'uk', 'min_quantity' => 5, 'max_quantity' => 2,
        ])->assertStatus(422);

        // A shopper (not the admin session) is charged the new amount.
        $this->app['auth']->forgetGuards();
        $this->checkout('United Kingdom', 1, $method)->assertOk();
        $this->assertEquals(7.5, (float) Order::latest('id')->first()->delivery_fee);
    }
}
