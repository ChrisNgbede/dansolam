<?php

namespace Tests\Feature;

use App\Models\Category;
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

    // ------------------------------------------------------------ product / category rules

    private function product(string $name, ?Category $category = null): Product
    {
        $product = Product::create([
            'ecommerce_id' => Ecommerce::first()->id, 'name' => $name, 'slug' => \Illuminate\Support\Str::slug($name) . '-' . uniqid(),
            'sku' => strtoupper(uniqid()), 'price' => 10, 'stock_quantity' => 100, 'status' => 'published', 'has_variants' => false,
        ]);
        if ($category) $product->categories()->attach($category->id);
        return $product;
    }

    private function rule(array $attrs): ShippingRate
    {
        return ShippingRate::create(array_merge([
            'zone' => 'all', 'rate' => 9, 'type' => 'flat', 'calculation_method' => 'flat', 'applicability' => 'global',
            'sales_channel' => 'storefront', 'is_active' => true, 'shipping_zone_type' => 'all', 'sort_order' => 50,
        ], $attrs));
    }

    private function namesFor(string $country, array $cart): array
    {
        return app(ShippingCalculator::class)->eligible($country, $cart)->pluck('name')->all();
    }

    public function test_category_rule_applies_when_the_bag_contains_that_category(): void
    {
        $perfumes = Category::create(['name' => 'Perfumes', 'slug' => 'perfumes']);
        $oud = Category::create(['name' => 'Oud', 'slug' => 'oud', 'parent_id' => $perfumes->id]);
        $perfume = $this->product('Rose Perfume', $oud); // sub-category counts
        $this->rule(['name' => 'Fragrance courier', 'category_ids' => [$perfumes->id]]);

        $this->assertContains('Fragrance courier', $this->namesFor('United Kingdom', [['product_id' => $perfume->id, 'quantity' => 1], ['product_id' => $this->product->id, 'quantity' => 1]]));
        $this->assertNotContains('Fragrance courier', $this->namesFor('United Kingdom', [['product_id' => $this->product->id, 'quantity' => 2]]));
    }

    public function test_all_items_rule_needs_every_item_to_match(): void
    {
        $soap = $this->product('Black Soap');
        $this->rule(['name' => 'Soap-only post', 'product_ids' => [$soap->id], 'target_match' => 'all']);

        $this->assertContains('Soap-only post', $this->namesFor('United Kingdom', [['product_id' => $soap->id, 'quantity' => 3]]));
        $this->assertNotContains('Soap-only post', $this->namesFor('United Kingdom', [['product_id' => $soap->id, 'quantity' => 3], ['product_id' => $this->product->id, 'quantity' => 1]]));
    }

    public function test_quantity_conditions_on_matching_items(): void
    {
        $soap = $this->product('Black Soap');
        $cart = fn (int $soaps) => [['product_id' => $soap->id, 'quantity' => $soaps], ['product_id' => $this->product->id, 'quantity' => 5]];

        foreach ([
            ['lt', 3, [1, 2], [3, 4]],
            ['lte', 3, [1, 3], [4]],
            ['gt', 3, [4, 9], [1, 3]],
            ['gte', 3, [3, 4], [2]],
            ['eq', 3, [3], [2, 4]],
        ] as [$condition, $value, $yes, $no]) {
            ShippingRate::where('name', 'like', 'Soap %')->delete();
            $this->rule(['name' => "Soap {$condition}", 'product_ids' => [$soap->id], 'quantity_basis' => 'matching', 'quantity_condition' => $condition, 'quantity_value' => $value]);
            foreach ($yes as $n) $this->assertContains("Soap {$condition}", $this->namesFor('United Kingdom', $cart($n)), "{$condition} {$value} should allow {$n}");
            foreach ($no as $n) $this->assertNotContains("Soap {$condition}", $this->namesFor('United Kingdom', $cart($n)), "{$condition} {$value} should refuse {$n}");
        }
    }

    public function test_bag_quantity_counts_every_item(): void
    {
        $soap = $this->product('Black Soap');
        $this->rule(['name' => 'Soap big bag', 'product_ids' => [$soap->id], 'quantity_basis' => 'bag', 'quantity_condition' => 'gte', 'quantity_value' => 5]);

        // 1 soap + 4 others = 5 items in the bag.
        $this->assertContains('Soap big bag', $this->namesFor('United Kingdom', [['product_id' => $soap->id, 'quantity' => 1], ['product_id' => $this->product->id, 'quantity' => 4]]));
        $this->assertNotContains('Soap big bag', $this->namesFor('United Kingdom', [['product_id' => $soap->id, 'quantity' => 1], ['product_id' => $this->product->id, 'quantity' => 3]]));
    }

    public function test_targeted_rule_can_replace_general_methods(): void
    {
        $perfume = $this->product('Oud Perfume');
        $this->rule(['name' => 'Fragrance only', 'product_ids' => [$perfume->id], 'overrides_others' => true]);

        $names = $this->namesFor('United Kingdom', [['product_id' => $perfume->id, 'quantity' => 1]]);
        $this->assertSame(['Fragrance only'], $names);

        // Bags without the perfume still see the general methods.
        $this->assertSame(['Uk Shipping (1-3 Items)', 'Pick Up'], $this->namesFor('United Kingdom', [['product_id' => $this->product->id, 'quantity' => 1]]));
    }

    public function test_checkout_enforces_product_rules_and_charges_them(): void
    {
        $perfume = $this->product('Oud Perfume');
        $rule = $this->rule(['name' => 'Fragrance only', 'rate' => 12.5, 'product_ids' => [$perfume->id], 'overrides_others' => true]);
        $payload = fn (int $productId, int $methodId) => [
            'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'customer_phone' => '+447700900000',
            'delivery_address' => '1 High Street', 'delivery_city' => 'London', 'delivery_postcode' => 'SW1A 1AA', 'delivery_state' => 'Greater London',
            'delivery_country' => 'United Kingdom', 'payment_method' => 'bank_transfer', 'shipping_rate_id' => $methodId,
            'items' => [['product_id' => $productId, 'quantity' => 1]],
        ];

        // The general method is replaced for this bag, so it is refused.
        $this->postJson('/api/checkout', $payload($perfume->id, $this->method('Uk Shipping (1-3 Items)')->id))->assertStatus(422);
        $this->postJson('/api/checkout', $payload($perfume->id, $rule->id))->assertOk();
        $this->assertEquals(12.5, (float) Order::latest('id')->first()->delivery_fee);

        // And it is not available for a bag without the perfume.
        $this->postJson('/api/checkout', $payload($this->product->id, $rule->id))->assertStatus(422);
    }

    public function test_storefront_gets_the_targeting_it_needs(): void
    {
        $cat = Category::create(['name' => 'Oils', 'slug' => 'oils']);
        $oil = $this->product('Argan Oil', $cat);
        $this->rule(['name' => 'Oil post', 'category_ids' => [$cat->id], 'quantity_condition' => 'gt', 'quantity_value' => 2]);

        $row = collect($this->getJson('/api/shipping-rates')->assertOk()->json('data'))->firstWhere('name', 'Oil post');
        $this->assertSame([$oil->id], $row['target_product_ids']);
        $this->assertSame('gt', $row['quantity_condition']);
        $this->assertNull(collect($this->getJson('/api/shipping-rates')->json('data'))->firstWhere('name', 'Pick Up')['target_product_ids']);
    }

    public function test_admin_saves_targeting_and_conditions(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $cat = Category::create(['name' => 'Oils', 'slug' => 'oils']);

        $this->postJson('/api/admin/shipping-rates', [
            'name' => 'Oils over 2', 'rate' => 4, 'zone' => 'uk', 'category_ids' => [$cat->id], 'product_ids' => [$this->product->id],
            'target_match' => 'any', 'quantity_basis' => 'matching', 'quantity_condition' => 'gt', 'quantity_value' => 2,
            'min_quantity' => 1, 'max_quantity' => 3, 'overrides_others' => true, 'is_active' => true,
        ])->assertCreated();

        $saved = ShippingRate::where('name', 'Oils over 2')->first();
        $this->assertSame([$cat->id], $saved->category_ids);
        $this->assertSame('gt', $saved->quantity_condition);
        $this->assertNull($saved->min_quantity); // not used with a single-number condition
        $this->assertTrue($saved->overrides_others);

        // A single-number condition needs its number.
        $this->postJson('/api/admin/shipping-rates', ['name' => 'Bad', 'rate' => 1, 'zone' => 'uk', 'quantity_condition' => 'lt'])
            ->assertStatus(422)->assertJsonValidationErrors('quantity_value');
    }

    // ------------------------------------------------------------ charge per item

    private function chargeFor(string $methodName, array $cart): float
    {
        $calc = app(ShippingCalculator::class);
        return $calc->chargeFor(ShippingRate::where('name', $methodName)->firstOrFail(), $cart);
    }

    public function test_per_item_charge_multiplies_by_units_of_the_targeted_item(): void
    {
        $soap = $this->product('Black Soap');
        $this->rule(['name' => 'Soap post', 'rate' => 5, 'charge_per_item' => true, 'product_ids' => [$soap->id]]);

        foreach ([1 => 5.0, 3 => 15.0, 10 => 50.0] as $units => $expected) {
            $cart = [['product_id' => $soap->id, 'quantity' => $units], ['product_id' => $this->product->id, 'quantity' => 2]];
            $this->assertSame($expected, $this->chargeFor('Soap post', $cart), "{$units} soaps");
        }
    }

    public function test_per_item_charge_counts_every_targeted_product(): void
    {
        $oils = Category::create(['name' => 'Oils', 'slug' => 'oils']);
        $argan = $this->product('Argan Oil', $oils);
        $shea = $this->product('Shea Oil', $oils);
        $this->rule(['name' => 'Oil post', 'rate' => 2.5, 'charge_per_item' => true, 'category_ids' => [$oils->id]]);

        // 2 argan + 1 shea = 3 oils (the cream is not counted) => 3 x 2.50
        $this->assertSame(7.5, $this->chargeFor('Oil post', [
            ['product_id' => $argan->id, 'quantity' => 2], ['product_id' => $shea->id, 'quantity' => 1], ['product_id' => $this->product->id, 'quantity' => 4],
        ]));
    }

    public function test_general_per_item_method_counts_the_whole_bag(): void
    {
        $this->rule(['name' => 'Per item everywhere', 'rate' => 1.2, 'charge_per_item' => true]);
        $this->assertSame(4.8, $this->chargeFor('Per item everywhere', [['product_id' => $this->product->id, 'quantity' => 4]]));
    }

    public function test_methods_without_per_item_keep_their_flat_charge(): void
    {
        $this->assertSame(10.0, $this->chargeFor('Uk Shipping (4 Items and above)', [['product_id' => $this->product->id, 'quantity' => 9]]));
        $this->assertSame(0.0, $this->chargeFor('Pick Up', [['product_id' => $this->product->id, 'quantity' => 9]]));
    }

    public function test_checkout_bills_the_per_item_charge(): void
    {
        $soap = $this->product('Black Soap');
        $rule = $this->rule(['name' => 'Soap post', 'rate' => 5, 'charge_per_item' => true, 'product_ids' => [$soap->id], 'overrides_others' => true]);

        $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'customer_phone' => '+447700900000',
            'delivery_address' => '1 High Street', 'delivery_city' => 'London', 'delivery_postcode' => 'SW1A 1AA', 'delivery_state' => 'Greater London',
            'delivery_country' => 'United Kingdom', 'payment_method' => 'bank_transfer', 'shipping_rate_id' => $rule->id,
            'items' => [['product_id' => $soap->id, 'quantity' => 3]],
        ])->assertOk();

        $order = Order::latest('id')->first();
        $this->assertEquals(15.00, (float) $order->delivery_fee);
        $this->assertEquals(45.00, (float) $order->total_amount); // 3 x £10 + 3 x £5
        $applied = is_array($order->applied_shipping) ? $order->applied_shipping : json_decode($order->applied_shipping, true);
        $this->assertSame('per_item', $applied[0]['type']);
        $this->assertSame(3, $applied[0]['units']);
    }

    public function test_storefront_and_admin_handle_the_switch(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/admin/shipping-rates', ['name' => 'Per item UK', 'rate' => 3, 'zone' => 'uk', 'charge_per_item' => true, 'is_active' => true])->assertCreated();
        $this->assertTrue(ShippingRate::where('name', 'Per item UK')->first()->charge_per_item);

        $this->app['auth']->forgetGuards();
        $rows = collect($this->getJson('/api/shipping-rates')->json('data'));
        $this->assertTrue($rows->firstWhere('name', 'Per item UK')['charge_per_item']);
        $this->assertFalse($rows->firstWhere('name', 'Pick Up')['charge_per_item']);
    }
}
