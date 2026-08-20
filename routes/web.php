<?php

use Illuminate\Support\Facades\Route;

// Catch-all route to serve the React SPA for root and all storefront/admin URLs
Route::get('/', function () {
    return view('app');
});

Route::any('{any}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|_debugbar).*$');
