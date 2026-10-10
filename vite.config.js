import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Route pages that the server may preload on a direct visit (see resources/views/app.blade.php).
export const PRELOADABLE_PAGES = [
    'resources/js/pages/storefront/Shop.jsx',
    'resources/js/pages/storefront/ProductDetails.jsx',
    'resources/js/pages/storefront/PolicyPage.jsx',
    'resources/js/pages/storefront/Reviews.jsx',
];

// Long-lived libraries get their own chunks so a code change doesn't bust their cache.
const VENDOR_CHUNKS = {
    'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
    'vendor-data': ['@tanstack/react-query', 'zustand'],
    'vendor-icons': ['lucide-react'],
};

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx', ...PRELOADABLE_PAGES],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        target: 'es2020',
        cssCodeSplit: true,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;
                    for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS)) {
                        if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) return chunk;
                    }
                    return undefined;
                },
            },
        },
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
