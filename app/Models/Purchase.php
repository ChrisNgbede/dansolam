<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = ['ecommerce_id','supplier_id','user_id','purchase_number','supplier_name','purchase_date','expected_date','received_at','status','payment_status','payment_method','reference','subtotal','tax_amount','shipping_amount','discount_amount','total_amount','notes'];
    protected $casts = ['purchase_date'=>'date','expected_date'=>'date','received_at'=>'datetime','subtotal'=>'decimal:2','tax_amount'=>'decimal:2','shipping_amount'=>'decimal:2','discount_amount'=>'decimal:2','total_amount'=>'decimal:2'];
    public function items() { return $this->hasMany(PurchaseItem::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function user() { return $this->belongsTo(User::class); }
}
