<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosHeldCart extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'user_id',
        'ecommerce_id',
        'customer_id',
        'customer_name',
        'note',
        'status',
        'held_at',
        'resumed_at',
    ];

    protected $casts = [
        'held_at' => 'datetime',
        'resumed_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ecommerce(): BelongsTo
    {
        return $this->belongsTo(Ecommerce::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosHeldCartItem::class);
    }
}
