<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Shipping methods that target products and/or categories, with quantity
 * conditions (between, less than, at most, more than, at least, exactly).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->json('product_ids')->nullable()->after('max_quantity');
            $table->json('category_ids')->nullable()->after('product_ids');
            $table->string('target_match', 10)->default('any')->after('category_ids');          // any | all
            $table->string('quantity_basis', 10)->default('bag')->after('target_match');        // bag | matching
            $table->string('quantity_condition', 10)->default('between')->after('quantity_basis'); // between | lt | lte | gt | gte | eq
            $table->unsignedInteger('quantity_value')->nullable()->after('quantity_condition');
            $table->boolean('overrides_others')->default(false)->after('quantity_value');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->dropColumn(['product_ids', 'category_ids', 'target_match', 'quantity_basis', 'quantity_condition', 'quantity_value', 'overrides_others']);
        });
    }
};
