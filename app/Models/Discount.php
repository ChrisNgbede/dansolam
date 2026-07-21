<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'value',
        'min_qty_requirement',
        'free_qty_reward',
        'start_date',
        'end_date',
        'apply_to',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'value' => 'decimal:2',
        'min_qty_requirement' => 'integer',
        'free_qty_reward' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'discount_product');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'discount_category');
    }

    /**
     * Check if discount is currently active based on dates and is_active flag.
     */
    public function isCurrentlyActive(): bool
    {
        if (!$this->is_active) return false;

        $now = now()->startOfDay();

        if ($this->start_date && $now->lt($this->start_date)) return false;
        if ($this->end_date && $now->gt($this->end_date)) return false;

        return true;
    }

    /**
     * Check if discount applies to a specific product.
     */
    public function appliesToProduct(Product $product): bool
    {
        if (!$this->isCurrentlyActive()) return false;

        if ($this->apply_to === 'all') return true;

        if ($this->apply_to === 'products') {
            return $this->products()->where('products.id', $product->id)->exists();
        }

        if ($this->apply_to === 'categories') {
            $categoryIds = $this->categories()->pluck('categories.id')->toArray();
            $productCategoryIds = $product->categories()->pluck('categories.id')->toArray();
            return count(array_intersect($productCategoryIds, $categoryIds)) > 0;
        }

        return false;
    }
}
