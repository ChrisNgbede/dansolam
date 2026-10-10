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
        'show_eyebrow',
        'accent_title',
        'subtitle',
        'image_url',
        'gallery',
        'link_url',
        'primary_cta_label',
        'secondary_cta_label',
        'secondary_cta_url',
        'top_kicker',
        'top_text',
        'bottom_kicker',
        'bottom_text',
        'show_highlights',
        'type',
        'layout_mode',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'gallery' => 'array',
        'show_eyebrow' => 'boolean',
        'show_highlights' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
