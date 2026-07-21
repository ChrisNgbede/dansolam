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
        // 1. Create newsletter_subscribers table
        if (!Schema::hasTable('newsletter_subscribers')) {
            Schema::create('newsletter_subscribers', function (Blueprint $table) {
                $table->id();
                $table->string('email')->unique();
                $table->timestamps();
            });
        }

        // 2. Add measurements JSON column to customers table
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'measurements')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->json('measurements')->nullable()->after('phone');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('customers') && Schema::hasColumn('customers', 'measurements')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('measurements');
            });
        }

        Schema::dropIfExists('newsletter_subscribers');
    }
};
