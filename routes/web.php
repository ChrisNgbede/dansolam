<?php

use Illuminate\Support\Facades\Route;

// Catch-all route to serve the React SPA for all storefront/admin URLs
Route::any('{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|_debugbar).*$');
