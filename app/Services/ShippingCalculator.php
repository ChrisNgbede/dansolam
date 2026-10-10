<?php

namespace App\Services;

use App\Models\ShippingRate;
use Illuminate\Support\Collection;

/**
 * Shipping rules carried over from the old store:
 *   - every method is a fixed charge in the store currency;
 *   - a method applies when the cart's total item quantity is inside its range
 *     and the delivery country is in its zone;
 *   - zones are "uk" (United Kingdom only), "international" (every other country,
 *     including Jersey, Guernsey and the Isle of Man) and "all";
 *   - the customer chooses one of the methods that apply.
 *
 * The storefront shows the same list, but the server always re-checks the choice
 * and charges the stored amount, never a figure sent by the browser.
 */
class ShippingCalculator
{
    /** Names a shopper might give for the UK (Crown Dependencies are not included). */
    private const UK_NAMES = [
        'united kingdom', 'uk', 'u.k.', 'gb', 'great britain', 'britain',
        'england', 'scotland', 'wales', 'northern ireland',
        'united kingdom of great britain and northern ireland',
    ];

    public static function isUk(?string $country): bool
    {
        return in_array(strtolower(trim((string) $country)), self::UK_NAMES, true);
    }

    public static function zoneFor(?string $country): string
    {
        return self::isUk($country) ? 'uk' : 'international';
    }

    /**
     * Active storefront methods, in display order.
     */
    public function activeMethods(): Collection
    {
        return ShippingRate::where('is_active', true)
            ->whereIn('sales_channel', ['storefront', 'both'])
            ->orderBy('sort_order')
            ->orderBy('rate')
            ->orderBy('id')
            ->get();
    }

    public function matches(ShippingRate $method, ?string $country, int $quantity): bool
    {
        $zone = $method->zone ?: 'all';
        if ($zone !== 'all' && $zone !== self::zoneFor($country)) {
            return false;
        }
        if ($method->min_quantity !== null && $quantity < $method->min_quantity) {
            return false;
        }
        if ($method->max_quantity !== null && $quantity > $method->max_quantity) {
            return false;
        }

        return true;
    }

    /**
     * Methods the customer can choose for this country and cart quantity.
     */
    public function eligible(?string $country, int $quantity): Collection
    {
        return $this->activeMethods()
            ->filter(fn (ShippingRate $method) => $this->matches($method, $country, $quantity))
            ->values();
    }

    /**
     * Resolve the customer's choice; null when it doesn't apply to this cart.
     */
    public function resolve(?int $methodId, ?string $country, int $quantity): ?ShippingRate
    {
        if (!$methodId) {
            return null;
        }

        return $this->eligible($country, $quantity)->firstWhere('id', $methodId);
    }

    /**
     * The method to pre-select: the one flagged as default, else the first
     * non-pickup delivery option, else whatever applies.
     */
    public function defaultFor(?string $country, int $quantity): ?ShippingRate
    {
        $eligible = $this->eligible($country, $quantity);

        return $eligible->firstWhere('is_default', true)
            ?? $eligible->firstWhere('is_pickup', false)
            ?? $eligible->first();
    }
}
