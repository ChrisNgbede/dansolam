<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'shipping_fee',
        'estimated_days',
    ];

    protected $casts = [
        'shipping_fee' => 'decimal:2',
    ];
}
