<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
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
        'rate' => 'decimal:2',
        'is_active' => 'boolean',
        'min_weight' => 'decimal:2',
        'max_weight' => 'decimal:2',
        'min_volume' => 'decimal:2',
        'max_volume' => 'decimal:2',
        'only_fragile' => 'boolean',
        'shipping_countries' => 'array',
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
