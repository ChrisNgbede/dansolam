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
        // Discounts Table
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // percentage, fixed_amount, bogo (buy X get Y free)
            $table->decimal('value', 15, 2)->default(0);
            $table->integer('min_qty_requirement')->default(0); // For BOGO: Buy X
            $table->integer('free_qty_reward')->default(0);      // For BOGO: Get Y Free
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('apply_to')->default('all'); // all, products, categories
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Discount Product pivot table
        Schema::create('discount_product', function (Blueprint $table) {
            $table->foreignId('discount_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->primary(['discount_id', 'product_id']);
        });

        // Discount Category pivot table
        Schema::create('discount_category', function (Blueprint $table) {
            $table->foreignId('discount_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->primary(['discount_id', 'category_id']);
        });

        // Taxes Table
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('rate', 5, 2); // e.g. 7.50 for 7.5%
            $table->string('type')->default('exclusive'); // inclusive, exclusive
            $table->text('applicable_areas')->nullable(); // JSON list of states/countries, or "all"
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add tax columns to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('tax_amount', 15, 2)->default(0)->after('discount_amount');
            $table->text('tax_details')->nullable()->after('tax_amount'); // json string details
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tax_amount', 'tax_details']);
        });
        Schema::dropIfExists('taxes');
        Schema::dropIfExists('discount_category');
        Schema::dropIfExists('discount_product');
        Schema::dropIfExists('discounts');
    }
};
