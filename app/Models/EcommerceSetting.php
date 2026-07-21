<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EcommerceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'ecommerce_id',
        'key',
        'value',
    ];

    public function ecommerce(): BelongsTo
    {
        return $this->belongsTo(Ecommerce::class);
    }
}
