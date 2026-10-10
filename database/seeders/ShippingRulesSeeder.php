<?php

namespace Database\Seeders;

use App\Models\ShippingRate;
use Illuminate\Database\Seeder;

/**
 * Shipping methods copied from the old store (WooCommerce "Advanced Flat Rate").
 * Each is a fixed £ charge chosen by cart quantity and UK / International zone.
 *
 * The old "Testing" method is left out: its only rule pointed at a deleted product,
 * so it could never appear to customers.
 */
class ShippingRulesSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['name' => 'Uk Shipping (1-3 Items)', 'zone' => 'uk', 'min' => 1, 'max' => 3, 'rate' => 6],
            ['name' => 'Uk Shipping (4 Items and above)', 'zone' => 'uk', 'min' => 4, 'max' => null, 'rate' => 10],
            ['name' => 'International (1-2 Items)', 'zone' => 'international', 'min' => 1, 'max' => 2, 'rate' => 20],
            ['name' => 'International (3-4 Items)', 'zone' => 'international', 'min' => 3, 'max' => 4, 'rate' => 35],
            ['name' => 'International (5 Items and above)', 'zone' => 'international', 'min' => 5, 'max' => null, 'rate' => 50],
            [
                'name' => 'Pick Up', 'zone' => 'all', 'min' => 1, 'max' => null, 'rate' => 0, 'pickup' => true,
                'description' => 'If you want to pick up with us make this selection',
            ],
        ];

        $keep = [];
        foreach ($rules as $order => $rule) {
            $method = ShippingRate::updateOrCreate(['name' => $rule['name']], [
                'zone' => $rule['zone'],
                'min_quantity' => $rule['min'],
                'max_quantity' => $rule['max'],
                'rate' => $rule['rate'],
                'description' => $rule['description'] ?? null,
                'is_default' => false,
                'is_pickup' => $rule['pickup'] ?? false,
                'sort_order' => $order + 1,
                'type' => 'flat',
                'calculation_method' => 'flat',
                'applicability' => 'global',
                'sales_channel' => 'storefront',
                'is_active' => true,
                'shipping_zone_type' => 'all', // legacy column; zone above is what applies
                'shipping_countries' => null,
                'min_weight' => null,
                'max_weight' => null,
                'min_volume' => null,
                'max_volume' => null,
                'only_fragile' => false,
            ]);
            $keep[] = $method->id;
        }

        // Retire placeholder methods so only the store's real rules are offered.
        ShippingRate::whereNotIn('id', $keep)->update(['is_active' => false]);
    }
}
