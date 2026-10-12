<?php

namespace App\Services;

use App\Models\Category;
use App\Models\ShippingRate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Shipping rules:
 *   - every method is a fixed charge in the store currency;
 *   - zones are "uk" (United Kingdom only), "international" (every other country,
 *     including Jersey, Guernsey and the Isle of Man) and "all";
 *   - a method can target products and/or categories (a category includes its
 *     sub-categories). It then applies when the bag contains ANY of them, or only
 *     when EVERY item in the bag is one of them;
 *   - a quantity condition counts either every item in the bag or only the
 *     targeted items: between min and max, less than, at most, more than, at
 *     least, or exactly a number;
 *   - a targeted method can replace the general ones: when it applies, methods
 *     with no product/category target are hidden;
 *   - "charge per item": the charge is multiplied by the units the method covers
 *     (its targeted items, or every item in the bag for a general method), e.g.
 *     3 units at £5 = £15; otherwise the charge is a single flat amount;
 *   - the customer chooses one of the methods that apply.
 *
 * The storefront runs the same rules (cartStore.shippingMethodApplies) on data from
 * storefrontData(), but the server always re-checks the choice and charges the
 * stored amount, never a figure sent by the browser.
 */
class ShippingCalculator
{
    public const CONDITIONS = ['between', 'lt', 'lte', 'gt', 'gte', 'eq'];

    /** Names a shopper might give for the UK (Crown Dependencies are not included). */
    private const UK_NAMES = [
        'united kingdom', 'uk', 'u.k.', 'gb', 'great britain', 'britain',
        'england', 'scotland', 'wales', 'northern ireland',
        'united kingdom of great britain and northern ireland',
    ];

    /** @var array<int, array<int>|null> method id => targeted product ids (null = untargeted) */
    private array $targets = [];

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

    /**
     * Product ids a method targets (its products plus everything in its categories
     * and their sub-categories), or null when it targets no products/categories.
     */
    public function targetProductIds(ShippingRate $method): ?array
    {
        if ($method->id && array_key_exists($method->id, $this->targets)) {
            return $this->targets[$method->id];
        }

        $productIds = array_map('intval', array_filter((array) ($method->product_ids ?? [])));
        $categoryIds = array_map('intval', array_filter((array) ($method->category_ids ?? [])));

        if (!$productIds && !$categoryIds) {
            $result = null;
        } else {
            if ($categoryIds) {
                $all = $this->withSubcategories($categoryIds);
                $productIds = array_merge($productIds, DB::table('category_product')->whereIn('category_id', $all)->pluck('product_id')->map(fn ($id) => (int) $id)->all());
            }
            $result = array_values(array_unique($productIds));
        }

        if ($method->id) {
            $this->targets[$method->id] = $result;
        }
        return $result;
    }

    private function withSubcategories(array $ids): array
    {
        $all = $ids;
        $frontier = $ids;
        for ($depth = 0; $frontier && $depth < 10; $depth++) {
            $frontier = Category::whereIn('parent_id', $frontier)->pluck('id')->map(fn ($id) => (int) $id)->diff($all)->all();
            $all = array_merge($all, $frontier);
        }
        return $all;
    }

    /**
     * Normalise a cart: a list of ['product_id' => int|null, 'quantity' => int].
     * A bare number means "this many items" with no product details.
     */
    public static function normaliseCart(int|array $cart): array
    {
        if (is_int($cart)) {
            return $cart > 0 ? [['product_id' => null, 'quantity' => $cart]] : [];
        }

        return collect($cart)
            ->map(fn ($item) => [
                'product_id' => isset($item['product_id']) ? (int) $item['product_id'] : null,
                'quantity' => max(0, (int) ($item['quantity'] ?? 0)),
            ])
            ->filter(fn ($item) => $item['quantity'] > 0)
            ->values()
            ->all();
    }

    public static function quantityPasses(ShippingRate $method, int $quantity): bool
    {
        $value = $method->quantity_value;
        return match ($method->quantity_condition ?: 'between') {
            'lt' => $value === null || $quantity < $value,
            'lte' => $value === null || $quantity <= $value,
            'gt' => $value === null || $quantity > $value,
            'gte' => $value === null || $quantity >= $value,
            'eq' => $value === null || $quantity === $value,
            default => ($method->min_quantity === null || $quantity >= $method->min_quantity)
                && ($method->max_quantity === null || $quantity <= $method->max_quantity),
        };
    }

    public function matches(ShippingRate $method, ?string $country, int|array $cart): bool
    {
        $zone = $method->zone ?: 'all';
        if ($zone !== 'all' && $zone !== self::zoneFor($country)) {
            return false;
        }

        $items = self::normaliseCart($cart);
        $bagQuantity = array_sum(array_column($items, 'quantity'));
        if ($bagQuantity < 1) {
            return false;
        }

        $targets = $this->targetProductIds($method);
        $quantity = $bagQuantity;

        if ($targets !== null) {
            $matching = array_filter($items, fn ($item) => $item['product_id'] !== null && in_array($item['product_id'], $targets, true));
            if (!$matching) {
                return false;
            }
            if (($method->target_match ?: 'any') === 'all' && count($matching) !== count($items)) {
                return false;
            }
            if (($method->quantity_basis ?: 'bag') === 'matching') {
                $quantity = array_sum(array_column($matching, 'quantity'));
            }
        }

        return self::quantityPasses($method, $quantity);
    }

    /**
     * Units a method covers: its targeted items, or every item for a general method.
     */
    public function unitsCovered(ShippingRate $method, int|array $cart): int
    {
        $items = self::normaliseCart($cart);
        $targets = $this->targetProductIds($method);
        if ($targets !== null) {
            $items = array_filter($items, fn ($item) => $item['product_id'] !== null && in_array($item['product_id'], $targets, true));
        }
        return (int) array_sum(array_column($items, 'quantity'));
    }

    /**
     * What this method charges for the cart: the flat charge, or the charge per item
     * multiplied by the units it covers.
     */
    public function chargeFor(ShippingRate $method, int|array $cart): float
    {
        $rate = (float) $method->rate;
        if (!$method->charge_per_item) {
            return round($rate, 2);
        }
        return round($rate * $this->unitsCovered($method, $cart), 2);
    }

    /**
     * Methods the customer can choose for this country and cart.
     */
    public function eligible(?string $country, int|array $cart): Collection
    {
        $eligible = $this->activeMethods()
            ->filter(fn (ShippingRate $method) => $this->matches($method, $country, $cart))
            ->values();

        // A targeted method marked "replace general methods" hides the untargeted ones.
        $overriding = $eligible->contains(fn (ShippingRate $m) => $m->overrides_others && $this->targetProductIds($m) !== null);
        if ($overriding) {
            $eligible = $eligible->filter(fn (ShippingRate $m) => $this->targetProductIds($m) !== null)->values();
        }

        return $eligible;
    }

    /**
     * Resolve the customer's choice; null when it doesn't apply to this cart.
     */
    public function resolve(?int $methodId, ?string $country, int|array $cart): ?ShippingRate
    {
        if (!$methodId) {
            return null;
        }

        return $this->eligible($country, $cart)->firstWhere('id', $methodId);
    }

    /**
     * The method to pre-select: the one flagged as default, else the first
     * non-pickup delivery option, else whatever applies.
     */
    public function defaultFor(?string $country, int|array $cart): ?ShippingRate
    {
        $eligible = $this->eligible($country, $cart);

        return $eligible->firstWhere('is_default', true)
            ?? $eligible->firstWhere('is_pickup', false)
            ?? $eligible->first();
    }

    /**
     * What the storefront needs to apply the same rules in the browser.
     */
    public function storefrontData(): Collection
    {
        return $this->activeMethods()->map(fn (ShippingRate $rate) => $rate->only([
            'id', 'name', 'zone', 'min_quantity', 'max_quantity', 'rate', 'description', 'is_default', 'is_pickup', 'sort_order', 'is_active',
            'target_match', 'quantity_basis', 'quantity_condition', 'quantity_value', 'overrides_others', 'charge_per_item',
        ]) + ['target_product_ids' => $this->targetProductIds($rate)])->values();
    }
}
