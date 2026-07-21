<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id','product_id','product_variant_id','product_name','sku','quantity','unit_cost','line_total'];
    protected $casts = ['quantity'=>'integer','unit_cost'=>'decimal:2','line_total'=>'decimal:2'];
    public function purchase() { return $this->belongsTo(Purchase::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'product_variant_id'); }
}
