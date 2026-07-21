<?php

namespace App\Http\Middleware;

use App\Models\EcommerceSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PosEnabled
{
    /**
     * Ensure the POS module is enabled in ecommerce settings.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $setting = EcommerceSetting::where('key', 'module_pos_enabled')->first();

        if (!$setting || $setting->value !== 'true') {
            return response()->json([
                'success' => false,
                'message' => 'The Point of Sale module is not enabled. Enable it in Settings → Modules.',
            ], 403);
        }

        return $next($request);
    }
}
