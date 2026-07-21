<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['ecommerce_id','user_id','expense_number','expense_date','category','vendor','description','amount','payment_method','status','reference','receipt_url','notes'];
    protected $casts = ['expense_date' => 'date', 'amount' => 'decimal:2'];
    public function user() { return $this->belongsTo(User::class); }
}
