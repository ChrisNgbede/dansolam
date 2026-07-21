<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->string('shipping_zone_type')->default('all')->after('only_fragile'); // all, domestic, international, specific_countries
            $table->json('shipping_countries')->nullable()->after('shipping_zone_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_zone_type',
                'shipping_countries'
            ]);
        });
    }
};
