<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Dansolam - Organic Skincare</title>
    <meta name="description" content="Dansolam makes 100% organic body creams, oils, scrubs and soaps that moisturise, even out skin tone and restore natural radiance.">
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#17101F" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    @php
        $bootSettings = \App\Models\EcommerceSetting::whereIn('key', [
            'favicon_url', 'storefront_theme_mode', 'storefront_default_theme',
        ])->pluck('value', 'key');

        $faviconUrl = $bootSettings['favicon_url'] ?? '/favicon.ico';
        // 'user_choice' lets the visitor toggle; 'b_night' / 'light' are admin-enforced.
        $themeMode = $bootSettings['storefront_theme_mode'] ?? 'user_choice';
        $defaultTheme = $bootSettings['storefront_default_theme'] ?? 'dark';
    @endphp
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="{{ $faviconUrl }}">
    <link rel="apple-touch-icon" href="{{ $faviconUrl }}">

    <!-- Instant theme init: resolves the same way StorefrontLayout does, so there is no flash. -->
    <script>
        (function() {
            var mode = @json($themeMode);
            var fallback = @json($defaultTheme);
            var dark;
            if (mode === 'b_night') {
                dark = true;
            } else if (mode === 'light') {
                dark = false;
            } else {
                var saved = null;
                try { saved = localStorage.getItem('dansolam_storefront_theme'); } catch (e) {}
                dark = saved ? saved === 'dark' : fallback === 'dark';
            }
            document.documentElement.classList.toggle('dark', dark);
            document.documentElement.classList.toggle('storefront-dark', dark);
        })();
    </script>

    <!-- Loading state: neutral background and a visible spinner until the app has rendered. -->
    <style>
        html { background: #FFFFFF; }
        html.dark { background: #121114; }
        .boot-loader { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background: #FFFFFF; }
        html.dark .boot-loader { background: #121114; }
        .page-spinner { display: block; width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(0, 0, 0, .12); border-top-color: #EC268F; animation: page-spin .8s linear infinite; }
        html.dark .page-spinner { border-color: rgba(255, 255, 255, .18); border-top-color: #EC268F; }
        @keyframes page-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .page-spinner { animation-duration: 2.4s; } }
    </style>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    @php
        $fontsHref = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=Manrope:wght@400;500;600;700;800&display=swap';
    @endphp
    <link rel="preload" as="style" href="{{ $fontsHref }}">
    <link rel="stylesheet" href="{{ $fontsHref }}" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="{{ $fontsHref }}"></noscript>

    <!-- Vite Styles & Scripts -->
    @php
        // Fetch the current page's chunk in parallel with the app bundle instead of after it.
        $pageEntry = match (true) {
            request()->is('shop') => 'resources/js/pages/storefront/Shop.jsx',
            request()->is('product/*', 'products/*') => 'resources/js/pages/storefront/ProductDetails.jsx',
            request()->is('pages/*') => 'resources/js/pages/storefront/PolicyPage.jsx',
            request()->is('reviews') => 'resources/js/pages/storefront/Reviews.jsx',
            default => null,
        };
    @endphp
    @vite(array_values(array_filter(['resources/css/app.css', 'resources/js/app.jsx', $pageEntry])))
    @if (request()->is('shop'))
        <link rel="preload" as="image" href="/images/banners/shop_hero_banner.webp" fetchpriority="high">
    @endif
</head>
<body class="bg-white dark:bg-[#17101F] text-[#221B2B] dark:text-[#F3EFF6] font-sans antialiased selection:bg-[#EC268F] selection:text-white overflow-x-hidden transition-colors duration-300">
    
    <!-- React Mount Node -->
    <div id="root"><div class="boot-loader" role="status" aria-label="Loading"><span class="page-spinner"></span></div></div>

    <!-- PWA Service Worker Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service worker registered successfully', reg.scope))
                    .catch(err => console.log('Service worker registration failed: ', err));
            });
        }
    </script>
</body>
</html>
