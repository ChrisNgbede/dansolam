<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_postcode', 20)->nullable()->after('delivery_state');
        });
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->string('postcode', 20)->nullable()->after('state');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('delivery_postcode'));
        Schema::table('customer_addresses', fn (Blueprint $table) => $table->dropColumn('postcode'));
    }
};
