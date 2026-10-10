<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Shipping methods as the old store defined them: a fixed charge that applies when
 * the cart quantity falls in a range and the customer is in a zone (UK or
 * International). The customer picks one of the methods that match.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->string('zone', 20)->default('all')->after('name');           // all | uk | international
            $table->unsignedInteger('min_quantity')->nullable()->after('zone');
            $table->unsignedInteger('max_quantity')->nullable()->after('min_quantity');
            $table->string('description', 500)->nullable()->after('max_quantity'); // shown as a tooltip
            $table->boolean('is_default')->default(false)->after('description');
            $table->boolean('is_pickup')->default(false)->after('is_default');
            $table->integer('sort_order')->default(0)->after('is_pickup');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_rates', function (Blueprint $table) {
            $table->dropColumn(['zone', 'min_quantity', 'max_quantity', 'description', 'is_default', 'is_pickup', 'sort_order']);
        });
    }
};
