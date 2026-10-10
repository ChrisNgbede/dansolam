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
        // Use the SMTP account saved in admin settings for every email, when one is set.
        $this->app->afterResolving('mail.manager', function () {
            try {
                \App\Services\StoreMailer::apply();
            } catch (\Throwable $e) {
                // No database yet (install/migrations): keep the .env mailer.
            }
        });
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
