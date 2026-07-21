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
        // 1. Add optional attributes to products
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('weight', 8, 2)->nullable()->after('low_stock_threshold'); // in kg
            $table->string('color_attribute')->nullable()->after('weight');
            $table->decimal('width', 8, 2)->nullable()->after('color_attribute'); // in cm
            $table->decimal('height', 8, 2)->nullable()->after('width'); // in cm
            $table->decimal('depth', 8, 2)->nullable()->after('height'); // in cm
            $table->string('material')->nullable()->after('depth');
            $table->boolean('is_fragile')->default(false)->after('material');
        });

        // 2. Add advanced shipping rules options to shipping_rates
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->string('calculation_method')->default('flat')->after('type'); // flat, per_item, per_kg, per_volume
            $table->decimal('min_weight', 8, 2)->nullable()->after('calculation_method'); // in kg
            $table->decimal('max_weight', 8, 2)->nullable()->after('min_weight'); // in kg
            $table->decimal('min_volume', 12, 2)->nullable()->after('max_weight'); // in cubic cm
            $table->decimal('max_volume', 12, 2)->nullable()->after('min_volume'); // in cubic cm
            $table->boolean('only_fragile')->default(false)->after('max_volume');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->dropColumn([
                'calculation_method',
                'min_weight',
                'max_weight',
                'min_volume',
                'max_volume',
                'only_fragile'
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'weight',
                'color_attribute',
                'width',
                'height',
                'depth',
                'material',
                'is_fragile'
            ]);
        });
    }
};
