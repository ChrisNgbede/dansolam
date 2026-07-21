<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['ecommerce_id','name','contact_person','email','phone','address','tax_number','notes','is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function purchases() { return $this->hasMany(Purchase::class); }
}
