<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'content',
        'image_path',
        'status',
        'meta_title',
        'meta_description',
        'blog_category_id',
    ];

    public function category()
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    public function tags()
    {
        return $this->belongsToMany(BlogTag::class, 'article_blog_tag');
    }

    public function comments()
    {
        return $this->hasMany(BlogComment::class);
    }
}
