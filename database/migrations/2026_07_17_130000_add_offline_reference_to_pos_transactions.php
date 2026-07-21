<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pos_transactions', function (Blueprint $table) {
            $table->string('offline_reference')->nullable()->unique()->after('transaction_number');
        });
    }

    public function down(): void
    {
        Schema::table('pos_transactions', fn (Blueprint $table) => $table->dropUnique(['offline_reference']));
        Schema::table('pos_transactions', fn (Blueprint $table) => $table->dropColumn('offline_reference'));
    }
};
