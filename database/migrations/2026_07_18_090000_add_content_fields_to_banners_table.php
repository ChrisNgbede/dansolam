<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('eyebrow')->nullable()->after('title');
            $table->string('accent_title')->nullable()->after('eyebrow');
            $table->string('primary_cta_label')->nullable()->after('link_url');
            $table->string('secondary_cta_label')->nullable()->after('primary_cta_label');
            $table->string('secondary_cta_url')->nullable()->after('secondary_cta_label');
            $table->string('top_kicker')->nullable()->after('secondary_cta_url');
            $table->string('top_text')->nullable()->after('top_kicker');
            $table->string('bottom_kicker')->nullable()->after('top_text');
            $table->string('bottom_text')->nullable()->after('bottom_kicker');
            $table->unsignedInteger('sort_order')->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn([
                'eyebrow', 'accent_title', 'primary_cta_label', 'secondary_cta_label',
                'secondary_cta_url', 'top_kicker', 'top_text', 'bottom_kicker',
                'bottom_text', 'sort_order',
            ]);
        });
    }
};
