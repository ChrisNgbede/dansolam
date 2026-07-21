<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('ecommerce_settings')) {
                $timezoneSetting = \Illuminate\Support\Facades\DB::table('ecommerce_settings')
                    ->where('key', 'system_timezone')
                    ->first();
                if ($timezoneSetting && $timezoneSetting->value) {
                    config(['app.timezone' => $timezoneSetting->value]);
                    date_default_timezone_set($timezoneSetting->value);
                }
            }
        } catch (\Throwable $e) {
            // Silence exceptions during setup/migrations
        }
    }
}
