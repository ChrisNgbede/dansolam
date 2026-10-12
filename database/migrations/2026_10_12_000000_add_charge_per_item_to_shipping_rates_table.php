<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Charge per item": the method's charge is multiplied by the number of units it
 * covers (its targeted items, or every item in the bag for a general method).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->boolean('charge_per_item')->default(false)->after('rate');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_rates', fn (Blueprint $table) => $table->dropColumn('charge_per_item'));
    }
};
