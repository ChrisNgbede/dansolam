<?php

namespace App\Http\Middleware;

use App\Models\EcommerceSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ModuleEnabled
{
    public function handle(Request $request, Closure $next, string $settingKey): Response
    {
        $enabled = EcommerceSetting::where('key', $settingKey)->value('value');
        if (!in_array($enabled, ['true', '1', 1, true], true)) {
            return response()->json(['success'=>false, 'message'=>'This module is disabled. Enable it in Settings → Modules.'], 403);
        }
        return $next($request);
    }
}
