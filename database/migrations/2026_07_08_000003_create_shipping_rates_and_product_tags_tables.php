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
        // Shipping Configurations
        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('flat'); // flat, per_item
            $table->decimal('rate', 15, 2)->default(0);
            $table->string('applicability')->default('global'); // global, products, categories
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shipping_rate_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_rate_id')->constrained('shipping_rates')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
        });

        Schema::create('shipping_rate_category', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_rate_id')->constrained('shipping_rates')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
        });

        // Add applied_shipping column to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->json('applied_shipping')->nullable()->after('delivery_fee');
        });

        // Product Tags
        Schema::create('product_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('label_text')->nullable();
            $table->string('icon')->nullable(); // Emoji or icon name
            $table->string('image_url')->nullable(); // Image uploaded for tag badge
            $table->string('bg_color')->default('#f3f4f6');
            $table->string('text_color')->default('#1f2937');
            $table->timestamps();
        });

        Schema::create('product_product_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('product_tag_id')->constrained('product_tags')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_product_tag');
        Schema::dropIfExists('product_tags');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('applied_shipping');
        });

        Schema::dropIfExists('shipping_rate_category');
        Schema::dropIfExists('shipping_rate_product');
        Schema::dropIfExists('shipping_rates');
    }
};
