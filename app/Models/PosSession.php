<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ecommerce_id',
        'register_name',
        'opening_cash',
        'closing_cash',
        'expected_cash',
        'cash_sales_total',
        'card_sales_total',
        'transfer_sales_total',
        'total_sales',
        'total_transactions',
        'total_items_sold',
        'opened_at',
        'closed_at',
        'notes',
        'status',
    ];

    protected $casts = [
        'opening_cash' => 'decimal:2',
        'closing_cash' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'cash_sales_total' => 'decimal:2',
        'card_sales_total' => 'decimal:2',
        'transfer_sales_total' => 'decimal:2',
        'total_sales' => 'decimal:2',
        'total_transactions' => 'integer',
        'total_items_sold' => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ecommerce(): BelongsTo
    {
        return $this->belongsTo(Ecommerce::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PosTransaction::class, 'session_id');
    }

    public function heldCarts(): HasMany
    {
        return $this->hasMany(PosHeldCart::class, 'session_id');
    }

    public function cashMovements(): HasMany
    {
        return $this->hasMany(PosCashMovement::class, 'session_id');
    }
}
