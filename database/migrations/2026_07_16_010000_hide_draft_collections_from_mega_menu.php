<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('collections')
            ->where('is_published', false)
            ->update(['show_in_mega_menu' => false]);
    }

    public function down(): void
    {
        // This normalization intentionally does not restore contradictory states.
    }
};
