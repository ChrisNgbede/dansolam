<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_spend',
        'start_date',
        'end_date',
        'usage_limit',
        'user_limit',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_spend' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'usage_limit' => 'integer',
        'user_limit' => 'integer',
    ];

    public function isValidForAmount(float $amount): bool
    {
        $today = now()->startOfDay();

        if ($this->start_date && $this->start_date->startOfDay()->gt($today)) {
            return false;
        }

        if ($this->end_date && $this->end_date->startOfDay()->lt($today)) {
            return false;
        }

        if ($amount < $this->min_spend) {
            return false;
        }

        return true;
    }
}
