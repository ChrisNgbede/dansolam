<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FittingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'ecommerce_id',
        'name',
        'email',
        'phone',
        'preferred_date',
        'preferred_time',
        'guests_count',
        'notes',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'preferred_date' => 'date:Y-m-d',
        'guests_count' => 'integer',
    ];
}
