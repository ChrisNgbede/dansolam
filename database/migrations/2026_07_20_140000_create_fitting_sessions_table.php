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
        Schema::create('fitting_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ecommerce_id')->nullable()->index();
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->date('preferred_date');
            $table->string('preferred_time');
            $table->integer('guests_count')->default(1);
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // pending, acknowledged, approved, declined, completed
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fitting_sessions');
    }
};
