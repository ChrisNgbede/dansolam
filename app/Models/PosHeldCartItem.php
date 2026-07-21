<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosHeldCartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'pos_held_cart_id',
        'product_id',
        'product_variant_id',
        'product_name',
        'variant_label',
        'price',
        'quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function heldCart(): BelongsTo
    {
        return $this->belongsTo(PosHeldCart::class, 'pos_held_cart_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
