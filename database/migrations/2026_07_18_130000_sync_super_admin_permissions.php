<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        DB::table('roles')
            ->where('slug', 'super-admin')
            ->update([
                'permissions' => json_encode(config('admin_permissions.all', [])),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Permission synchronization is intentionally not reversed because doing
        // so could silently remove access introduced by later application versions.
    }
};
