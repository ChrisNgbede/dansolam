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
        if (!Schema::hasTable('newsletter_campaigns')) {
            Schema::create('newsletter_campaigns', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('ecommerce_id')->nullable()->default(1);
                $table->string('title');
                $table->string('subject');
                $table->string('preview_text')->nullable();
                $table->string('template')->default('custom');
                $table->longText('content_html');
                $table->string('cta_text')->nullable();
                $table->string('cta_url')->nullable();
                $table->string('banner_image_url')->nullable();
                $table->string('status')->default('draft');
                $table->integer('recipients_count')->default(0);
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('newsletter_sends')) {
            Schema::create('newsletter_sends', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('campaign_id');
                $table->string('email');
                $table->string('status')->default('sent');
                $table->text('error_message')->nullable();
                $table->timestamps();

                $table->foreign('campaign_id')->references('id')->on('newsletter_campaigns')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('newsletter_sends');
        Schema::dropIfExists('newsletter_campaigns');
    }
};
