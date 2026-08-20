<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Dansolam - Luxury Skincare & Beauty</title>
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#17101F" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#FBFAF8" media="(prefers-color-scheme: light)">
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

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Manrope:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">

    <!-- Vite Styles & Scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#FBFAF8] dark:bg-[#17101F] text-[#221B2B] dark:text-[#F3EFF6] font-sans antialiased selection:bg-[#EC268F] selection:text-white overflow-x-hidden transition-colors duration-300">
    
    <!-- React Mount Node -->
    <div id="root"></div>

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
