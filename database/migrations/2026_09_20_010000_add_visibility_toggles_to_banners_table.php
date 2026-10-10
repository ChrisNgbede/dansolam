<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->boolean('show_eyebrow')->default(true)->after('eyebrow');
            $table->boolean('show_highlights')->default(true)->after('bottom_text');
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn(['show_eyebrow', 'show_highlights']);
        });
    }
};
