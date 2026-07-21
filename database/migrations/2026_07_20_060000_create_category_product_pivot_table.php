<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Converts products from single-category (category_id FK) to
     * multi-category (category_product pivot table) architecture.
     */
    public function up(): void
    {
        // 1. Create the pivot table
        Schema::create('category_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['category_id', 'product_id']);
        });

        // 2. Migrate existing category_id data to the pivot table
        DB::statement('
            INSERT INTO category_product (category_id, product_id, created_at, updated_at)
            SELECT category_id, id, NOW(), NOW()
            FROM products
            WHERE category_id IS NOT NULL
        ');

        // 3. Drop the category_id foreign key and column from products
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-add category_id column to products
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('ecommerce_id')->constrained()->onDelete('set null');
        });

        // 2. Migrate pivot data back to the column (first category per product)
        $pivotData = DB::table('category_product')
            ->select('product_id', DB::raw('MIN(category_id) as category_id'))
            ->groupBy('product_id')
            ->get();

        foreach ($pivotData as $row) {
            DB::table('products')
                ->where('id', $row->product_id)
                ->update(['category_id' => $row->category_id]);
        }

        // 3. Drop the pivot table
        Schema::dropIfExists('category_product');
    }
};
