<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('permissions');
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // 2. Seed default system roles
        $allPermissions = [
            'dashboard.view',
            'products.view', 'products.manage',
            'collections.view', 'collections.manage',
            'orders.view', 'orders.manage', 'orders.export',
            'coupons.view', 'coupons.manage',
            'discounts.view', 'discounts.manage',
            'reports.view', 'reports.export',
            'customers.view', 'customers.manage',
            'reviews.view', 'reviews.moderate',
            'inventory.view', 'inventory.manage',
            'invoices.view', 'invoices.create',
            'gallery.view', 'gallery.manage',
            'articles.view', 'articles.manage',
            'pages.view', 'pages.manage',
            'inquiries.view', 'inquiries.manage',
            'brands.view', 'brands.manage',
            'users.view', 'users.manage',
            'settings.view', 'settings.manage',
            'taxes.view', 'taxes.manage',
            'shipping.view', 'shipping.manage',
        ];

        $now = now();

        DB::table('roles')->insert([
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Full unrestricted access to all modules and system settings.',
                'permissions' => json_encode($allPermissions),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Store Manager',
                'slug' => 'store-manager',
                'description' => 'Manages day-to-day store operations including products, orders, customers, and content.',
                'permissions' => json_encode([
                    'dashboard.view',
                    'products.view', 'products.manage',
                    'collections.view', 'collections.manage',
                    'orders.view', 'orders.manage', 'orders.export',
                    'coupons.view', 'coupons.manage',
                    'discounts.view', 'discounts.manage',
                    'reports.view', 'reports.export',
                    'customers.view', 'customers.manage',
                    'reviews.view', 'reviews.moderate',
                    'inventory.view', 'inventory.manage',
                    'invoices.view', 'invoices.create',
                    'gallery.view', 'gallery.manage',
                    'articles.view', 'articles.manage',
                    'pages.view', 'pages.manage',
                    'inquiries.view', 'inquiries.manage',
                    'brands.view', 'brands.manage',
                ]),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Fulfillment Staff',
                'slug' => 'fulfillment-staff',
                'description' => 'Handles order fulfillment, inventory tracking, and basic customer lookups.',
                'permissions' => json_encode([
                    'dashboard.view',
                    'orders.view', 'orders.manage',
                    'inventory.view', 'inventory.manage',
                    'customers.view',
                ]),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // 3. Add role_id to users table and migrate existing data
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('password')->constrained('roles')->nullOnDelete();
        });

        // 4. Map existing users' role strings to the new role_id
        $roleMap = DB::table('roles')->pluck('id', 'name')->toArray();

        $users = DB::table('users')->get();
        foreach ($users as $user) {
            $roleName = $user->role ?? 'Store Manager';
            $roleId = $roleMap[$roleName] ?? ($roleMap['Store Manager'] ?? null);

            DB::table('users')->where('id', $user->id)->update([
                'role_id' => $roleId,
            ]);
        }

        // 5. Drop the old role and permissions columns
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'permissions']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add old columns
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('Store Staff')->after('password');
            $table->json('permissions')->nullable()->after('role');
        });

        // Map role_id back to role name
        $roles = DB::table('roles')->pluck('name', 'id')->toArray();
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            $roleName = $roles[$user->role_id] ?? 'Store Manager';
            DB::table('users')->where('id', $user->id)->update([
                'role' => $roleName,
                'permissions' => '[]',
            ]);
        }

        // Drop the foreign key and role_id column
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
        });

        Schema::dropIfExists('roles');
    }
};
