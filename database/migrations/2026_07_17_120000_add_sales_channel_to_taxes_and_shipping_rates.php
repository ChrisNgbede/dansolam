<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('taxes', function (Blueprint $table) {
            $table->string('sales_channel', 20)->default('both')->after('applicable_areas');
        });
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->string('sales_channel', 20)->default('both')->after('applicability');
        });
    }

    public function down(): void
    {
        Schema::table('taxes', fn (Blueprint $table) => $table->dropColumn('sales_channel'));
        Schema::table('shipping_rates', fn (Blueprint $table) => $table->dropColumn('sales_channel'));
    }
};
