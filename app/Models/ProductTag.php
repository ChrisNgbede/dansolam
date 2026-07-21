<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label_text',
        'icon',
        'image_url',
        'bg_color',
        'text_color',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_product_tag');
    }
}
