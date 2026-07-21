<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'eyebrow',
        'accent_title',
        'subtitle',
        'image_url',
        'link_url',
        'primary_cta_label',
        'secondary_cta_label',
        'secondary_cta_url',
        'top_kicker',
        'top_text',
        'bottom_kicker',
        'bottom_text',
        'type',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
