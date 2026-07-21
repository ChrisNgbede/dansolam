<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogComment extends Model
{
    protected $fillable = ['article_id', 'name', 'email', 'content', 'is_approved'];

    protected $casts = [
        'is_approved' => 'boolean',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}
