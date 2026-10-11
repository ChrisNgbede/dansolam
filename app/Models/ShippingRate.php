<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'zone',
        'min_quantity',
        'max_quantity',
        'product_ids',
        'category_ids',
        'target_match',
        'quantity_basis',
        'quantity_condition',
        'quantity_value',
        'overrides_others',
        'description',
        'is_default',
        'is_pickup',
        'sort_order',
        'type',
        'rate',
        'applicability',
        'sales_channel',
        'is_active',
        'calculation_method',
        'min_weight',
        'max_weight',
        'min_volume',
        'max_volume',
        'only_fragile',
        'shipping_zone_type',
        'shipping_countries',
    ];

    protected $casts = [
        'product_ids' => 'array',
        'category_ids' => 'array',
        'quantity_value' => 'integer',
        'overrides_others' => 'boolean',
        'rate' => 'decimal:2',
        'is_active' => 'boolean',
        'min_weight' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'min_volume' => 'decimal:2',
        'max_volume' => 'decimal:2',
        'only_fragile' => 'boolean',
        'shipping_countries' => 'array',
        'min_quantity' => 'integer',
        'max_quantity' => 'integer',
        'is_default' => 'boolean',
        'is_pickup' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'shipping_rate_product');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'shipping_rate_category');
    }
}
