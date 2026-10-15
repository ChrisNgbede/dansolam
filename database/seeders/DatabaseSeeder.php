<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\DeliveryZone;
use App\Models\Banner;
use App\Models\Page;
use App\Models\Review;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Coupon;
use App\Models\Discount;
use App\Models\Tax;
use App\Models\ShippingRate;
use App\Models\ProductTag;
use App\Models\Article;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Models\BlogComment;
use App\Models\GalleryItem;
use App\Models\ContactInquiry;
use App\Models\InventoryLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Fetch roles
        $superAdminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');
        $storeManagerRoleId = DB::table('roles')->where('slug', 'store-manager')->value('id');

        // 1. Admin Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@dansolam.com'],
            [
                'name' => 'Dansolam Admin',
                'password' => Hash::make('password'),
                'role_id' => $superAdminRoleId,
            ]
        );

        User::firstOrCreate(
            ['email' => 'sales@dansolam.com'],
            [
                'name' => 'Sales Manager',
                'password' => Hash::make('password'),
                'role_id' => $storeManagerRoleId,
            ]
        );

        // 2. Ecommerce
        $ecommerce = Ecommerce::firstOrCreate(
            ['slug' => 'dansolam-beauty-home'],
            [
                'name' => 'Dansolam Beauty Home',
                'domain' => 'dansolam.com',
                'status' => 'active',
            ]
        );

        // 3. Ecommerce Settings
        $settings = [
            'logo_url' => '/images/logo.png',
            'favicon_url' => '/favicon.ico',
            'theme_primary_color' => '#654687',
            'tagline' => 'Beauty Pronounced',
            'description' => 'Looking Good Is Our Pride! Shop Dansolam organic skincare creams, whitening polish soaps, scrubs, discoloration oils, and luxury fragrances.',
            'instagram_url' => 'https://www.instagram.com/dansolam_official/',
            'instagram_handle' => '@dansolam_official',
            'facebook_url' => 'https://facebook.com/dansolam',
            'tiktok_url' => '',
            'youtube_url' => '',
            'twitter_url' => '',
            'whatsapp_number' => '+234 800 000 0000',
            'support_email' => 'info@dansolam.com',
            'store_address' => '',
            'opening_hours' => 'Monday–Saturday: 9:00 AM - 6:00 PM',
            'opening_hours_note' => 'Closed on Sundays',
            'currency' => 'GBP',
            'delivery_coverage' => 'Worldwide delivery',
            'bank_name' => '',
            'bank_account_number' => '',
            'bank_account_name' => 'Dansolam Beauty Home Ltd',
            'return_policy' => 'We accept returns within 7 days of delivery for unused products in original packaging.',
            'privacy_policy' => 'We respect your privacy. We collect your name, phone number, email, and address to process your orders securely.',
            'terms_conditions' => 'By shopping with us, you agree to our terms. Payments must be verified before delivery.',
            'shipping_base_domestic' => '5',
            'shipping_same_day_surcharge' => '10',
            'shipping_international_base' => '25',
            'shipping_free_threshold' => '500',
            'shipping_item_multiplier' => '3',
            'payment_gateway_active' => 'paystack',
            'paystack_key_public' => 'pk_test_mock123456789',
            'paystack_key_secret' => 'sk_test_mock123456789',
            'flutterwave_key_public' => 'flw_test_mock123456789',
            'flutterwave_key_secret' => 'flw_secret_mock123456789',
            'cod_enabled' => 'true',
            'announcement_show' => 'true',
            'announcement_text' => '🌿 100% Organic Skincare, Whitening Soaps & Discoloration Oils | 🎁 Use coupon code WELCOME10 for 10% OFF your first beauty order',
            'promo_popup_show' => 'true',
            'promo_popup_title' => 'Welcome to Dansolam Beauty Home',
            'promo_popup_body' => '<p>Subscribe to our newsletter for <strong>exclusive skincare offers</strong> and beauty tips!</p>',
            'promo_popup_image' => '/images/popup-banner.webp',
            'promo_popup_delay' => '5000',
            'show_gallery_page' => 'true',
            'show_blog_page' => 'true',
            'sold_count_enabled' => 'true',
            'sku_prefix' => 'DSL-',
            'sku_suffix' => '',
            'system_currency_code' => 'GBP',
            'system_currency_symbol' => '£',
            'system_timezone' => 'Europe/London',
        ];

        foreach ($settings as $key => $value) {
            EcommerceSetting::updateOrCreate(
                ['ecommerce_id' => $ecommerce->id, 'key' => $key],
                ['value' => $value]
            );
        }

        // 4. Categories
        $categoriesData = [
            ['name' => 'Body Cream', 'slug' => 'body-cream', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Creams', 'slug' => 'creams', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Fast Selling Cream', 'slug' => 'fast-selling-cream', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Women & Men ( Lighter Complexion)', 'slug' => 'women-men-lighter-complexion', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Women & Men (Chocolate Complexion)', 'slug' => 'women-men-chocolate-complexion', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Children Cream', 'slug' => 'children-cream', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Kids', 'slug' => 'kids', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Body Polish', 'slug' => 'body-polish', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Body Soap', 'slug' => 'body-soap', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Soaps', 'slug' => 'soaps', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Body Scrub', 'slug' => 'body-scrub', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Scrubs', 'slug' => 'scrubs', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Oils', 'slug' => 'oils', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => '3 Set', 'slug' => '3-set', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => '2 Set', 'slug' => '2-set', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Face Soap', 'slug' => 'face-soap', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Foot Cream', 'slug' => 'foot-cream', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Fast Selling Soap', 'slug' => 'fast-selling-soap', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Perfume & Fragrances', 'slug' => 'perfume-fragrances', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Balm & Ointment', 'slug' => 'balm-ointment', 'image_url' => '/images/categories/skincare.jpg'],
            ['name' => 'Herbs', 'slug' => 'herbs', 'image_url' => '/images/categories/skincare.jpg'],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::updateOrCreate(
                ['slug' => $c['slug']],
                ['name' => $c['name'], 'image_url' => $c['image_url'], 'is_visible' => true]
            );
        }

        // 5. Collections
        Collection::query()->delete();

        $collectionsData = [
            [
                'name' => 'Fast Selling Creams',
                'slug' => 'fast-selling-creams',
                'banner_url' => '/images/collections/creams.jpg',
                'category_slugs' => ['body-cream', 'creams', 'fast-selling-cream', 'children-cream', 'foot-cream']
            ],
            [
                'name' => 'Organic Soaps & Polishes',
                'slug' => 'organic-soaps-polishes',
                'banner_url' => '/images/collections/soaps.jpg',
                'category_slugs' => ['soaps', 'body-soap', 'face-soap', 'fast-selling-soap', 'body-polish']
            ],
            [
                'name' => 'Body & Face Scrubs',
                'slug' => 'body-face-scrubs',
                'banner_url' => '/images/collections/scrubs.jpg',
                'category_slugs' => ['scrubs', 'body-scrub']
            ],
            [
                'name' => 'Essential & Discoloration Oils',
                'slug' => 'essential-discoloration-oils',
                'banner_url' => '/images/collections/oils.jpg',
                'category_slugs' => ['oils', 'balm-ointment']
            ],
            [
                'name' => 'Luxury Sets & Combo Bundles',
                'slug' => 'luxury-sets-bundles',
                'banner_url' => '/images/collections/sets.jpg',
                'category_slugs' => ['2-set', '3-set', 'women-men-lighter-complexion', 'women-men-chocolate-complexion']
            ],
            [
                'name' => 'Perfume & Luxury Fragrances',
                'slug' => 'perfume-fragrances',
                'banner_url' => '/images/collections/perfumes.jpg',
                'category_slugs' => ['perfume-fragrances', 'herbs', 'kids']
            ],
        ];

        $collections = [];
        foreach ($collectionsData as $col) {
            $collection = Collection::updateOrCreate(
                ['slug' => $col['slug']],
                [
                    'name' => $col['name'],
                    'banner_url' => $col['banner_url'],
                    'is_published' => true,
                    'show_in_mega_menu' => true,
                ]
            );
            $collections[$col['slug']] = $collection;

            // Link categories to this collection for header mega menu
            $catIds = [];
            foreach ($col['category_slugs'] as $cSlug) {
                if (isset($categories[$cSlug])) {
                    $catIds[] = $categories[$cSlug]->id;
                }
            }
            if (!empty($catIds)) {
                $collection->categories()->sync($catIds);
            }
        }

        // 6. Delivery Zones
        $deliveryZones = [
            ['name' => 'Local Delivery (Standard)', 'shipping_fee' => 2000, 'estimated_days' => '1-2 Days'],
            ['name' => 'Nationwide Delivery', 'shipping_fee' => 5000, 'estimated_days' => '3-5 Days'],
            ['name' => 'Worldwide Delivery', 'shipping_fee' => 25000, 'estimated_days' => '7-10 Days'],
            ['name' => 'Store Pickup (SHOP)', 'shipping_fee' => 0, 'estimated_days' => 'Ready same day'],
            ['name' => 'Express Courier Delivery', 'shipping_fee' => 3500, 'estimated_days' => '1-2 Days'],
        ];

        foreach ($deliveryZones as $zone) {
            DeliveryZone::create($zone);
        }

        // 7. Shipping Rates
        $shippingRates = [
            ['name' => 'Standard Domestic', 'type' => 'flat', 'rate' => 5, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
            ['name' => 'Express Next-Day Dispatch', 'type' => 'flat', 'rate' => 10, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
            ['name' => 'International Express', 'type' => 'flat', 'rate' => 25, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'international', 'shipping_countries' => ['US', 'CA', 'AU', 'DE', 'FR']],
            ['name' => 'Free Delivery (Above £500)', 'type' => 'flat', 'rate' => 0, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
        ];

        foreach ($shippingRates as $rate) {
            ShippingRate::create($rate);
        }

        // 8. Taxes
        Tax::updateOrCreate(['name' => 'VAT'], ['rate' => 20, 'type' => 'exclusive', 'applicable_areas' => 'all', 'is_active' => true]);

        // 9. Coupons
        $coupons = [
            ['code' => 'WELCOME10', 'type' => 'percentage', 'value' => 10, 'min_spend' => 20000, 'start_date' => now()->subDays(30), 'end_date' => now()->addDays(365), 'usage_limit' => 100, 'user_limit' => 1],
            ['code' => 'GLOW20', 'type' => 'percentage', 'value' => 20, 'min_spend' => 50000, 'start_date' => now()->subDays(5), 'end_date' => now()->addDays(10), 'usage_limit' => 50, 'user_limit' => 1],
            ['code' => 'FREEDELIVERY', 'type' => 'free_delivery', 'value' => 0, 'min_spend' => 100000, 'start_date' => now()->subDays(10), 'end_date' => now()->addDays(60), 'usage_limit' => 200, 'user_limit' => 3],
        ];
        foreach ($coupons as $coupon) {
            Coupon::updateOrCreate(['code' => $coupon['code']], $coupon);
        }

        // 10. Product Tags
        $productTags = [
            ['name' => 'Organic', 'label_text' => '100% Organic', 'icon' => 'leaf', 'bg_color' => '#22c55e', 'text_color' => '#ffffff'],
            ['name' => 'Fast Selling', 'label_text' => 'Fast Selling', 'icon' => 'fire', 'bg_color' => '#ef4444', 'text_color' => '#ffffff'],
            ['name' => 'New Formula', 'label_text' => 'New Formula', 'icon' => 'star', 'bg_color' => '#654687', 'text_color' => '#ffffff'],
            ['name' => 'Best Seller', 'label_text' => 'Best Seller', 'icon' => 'crown', 'bg_color' => '#f59e0b', 'text_color' => '#ffffff'],
        ];
        $tags = [];
        foreach ($productTags as $tag) {
            $tags[$tag['name']] = ProductTag::updateOrCreate(['name' => $tag['name']], $tag);
        }

        // 11. Banners
        Banner::updateOrCreate(['title' => 'Beauty Pronounced', 'type' => 'hero'], ['subtitle' => 'Looking Good Is Our Pride! Experience 100% organic skincare, whitening soaps, glowing creams, and luxury fragrances.', 'image_url' => '/images/hero-banner.jpg', 'link_url' => '/shop', 'is_active' => true]);
        Banner::updateOrCreate(['title' => 'Dansolam Plus (Molato)', 'type' => 'promo'], ['subtitle' => 'Treat dark spots, sunburn, white patches, and discolouration naturally.', 'image_url' => '/images/promo-banner.jpg', 'link_url' => '/shop', 'is_active' => true]);

        // 12. Pages
        $pages = [
            [
                'title' => 'About Us',
                'slug' => 'about-us',
                'content' => '<h2>About Dansolam Beauty Home</h2><p>Welcome to <strong>Dansolam Beauty Home</strong>. We are a premier organic skincare shop dedicated to delivering flawless, radiant, and healthy skin through 100% natural organic formulations. <em>Looking Good Is Our Pride!</em></p><h3>Our Promise & Organic Purity</h3><p>Every Dansolam product is crafted with 100% natural herbs, almond extract, botanical oils, and essential nutrients. Our formulas protect, hydrate, and rejuvenate your skin without hydroquinone, steroids, or harsh chemicals. Whether you seek to fade dark spots, smooth sunburn, restore uneven skin tone, or maintain a golden glow, Dansolam provides proven organic solutions.</p>'
            ],
            [
                'title' => 'FAQ',
                'slug' => 'faq',
                'content' => '<h2>Frequently Asked Questions</h2><p>Find answers to common questions about Dansolam organic skincare products, shipping timelines, payment options, and patch testing.</p>'
            ],
            [
                'title' => 'Shipping & Delivery Policy',
                'slug' => 'shipping-delivery',
                'content' => '<h2>Dansolam Shipping & Delivery Policy</h2><p>We ensure fast, secure delivery of your organic skincare orders worldwide.</p><h3>Delivery Timelines & Rates</h3><ul><li><strong>UK Standard Delivery:</strong> 2–4 Business Days (£4.99 flat rate).</li><li><strong>UK Express Next-Day:</strong> Orders placed before 2 PM arrive next business day (£9.99).</li><li><strong>Europe Delivery:</strong> 5–7 Business Days (£14.99 flat rate).</li><li><strong>Rest of World:</strong> 7–14 Business Days via tracked international courier (£24.99).</li><li><strong>Free Delivery:</strong> Free UK shipping on all orders above £500!</li></ul><h3>Order Processing</h3><p>All orders are processed within 1–2 business days. You will receive a tracking number via email once your order has been dispatched.</p><h3>Customs & Import Duties</h3><p>For international orders, customs duties and import taxes may apply upon arrival in your country. These charges are the responsibility of the recipient and are not included in our shipping fees.</p>'
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => '<h2>Dansolam Privacy & Data Protection Policy</h2><p>At <strong>Dansolam Beauty Home</strong>, protecting your personal privacy and order security is our utmost priority. Looking Good Is Our Pride — and so is keeping your information safe!</p><h3>Information We Collect</h3><p>When you browse or place an order at Dansolam Beauty Home, we collect necessary transaction details including your name, delivery address, phone number, email address, and order items. Payment card details are processed directly and securely through PCI-DSS compliant payment gateways with end-to-end encryption. Dansolam never stores raw credit/debit card numbers on our servers.</p><h3>How We Use Your Data</h3><ul><li>To process, fulfill, and ship your skincare orders efficiently.</li><li>To send automated email order updates and tracking numbers.</li><li>To provide personalized customer support and product consultation.</li><li>To improve our online shopping catalog and skincare product offerings.</li></ul><h3>Third-Party Sharing & Security</h3><p>We do NOT sell, rent, or trade your personal information to third-party advertisers. Your information is shared strictly with trusted logistics partners solely for delivery purposes. All data is handled in compliance with applicable data protection regulations including GDPR.</p>'
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-conditions',
                'content' => '<h2>Dansolam Terms & Conditions</h2><p>Welcome to <strong>Dansolam Beauty Home</strong>. By accessing our website or purchasing products, you agree to comply with our Terms of Service.</p><h3>Product Quality & Usage Guidelines</h3><p>All Dansolam products are formulated with 100% organic ingredients. We recommend performing a small patch test on your arm 24 hours prior to full application. Store all creams, soaps, and oils in a cool, dry place away from direct sunlight.</p><h3>Order Processing & Cancellation</h3><p>Orders are processed within 24 hours of payment confirmation. Once an order has shipped, cancellations are subject to return shipping costs. All payments are processed securely through our verified payment gateways.</p>'
            ],
        ];
        foreach ($pages as $p) {
            Page::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // 13. Products
        Product::query()->delete();
        ProductImage::query()->delete();
        ProductVariant::query()->delete();

        $productsData = [
            [
                'name' => 'Glowing Moisturizing 500g (Fast selling)',
                'slug' => 'glowing-moisturizing-500g-fast-selling',
                'sku' => 'DSL-101',
                'price' => 64.99,
                'sale_price' => null,
                'short_description' => 'We also do follow up to give you the best service and up to date with your beautiful skin.\n\n\n\nFast selling',
                'description' => 'For Glowing Moisturizing.. Fast/ Best selling product ? three in one action, the rich formula of dansolam Moisturising Cream it helps to protect the skin\'s natural with three essential ceramides MVE technology to provide daily instant and long-lasting hydration, with this moisturizing cream it takes you gradually to the top and beyond....\n\nOne in all try this product and thank us later. \n\n\n\nLooking Good Is Our Pride!',
                'category_slug' => 'body-cream',
                'all_categories' => ['body-cream', 'creams', 'fast-selling-cream'],
                'images' => ['/storage/products/21.png', '/storage/products/glowing-moisturing.jpg'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => true,
            ],
            [
                'name' => 'Whitening cream 500g',
                'slug' => 'whitening-cream-500g',
                'sku' => 'DSL-102',
                'price' => 108.99,
                'sale_price' => null,
                'short_description' => 'Dansolam whitening (very Stronge)the percentage can be increased.. This Effect cream is specially formulated to smooth out the skin tone progressively reducing spot coloration and increasing luminosity, while also preventing the appearan...',
                'description' => 'Dansolam whitening (very Stronge)the percentage can be increased.. This Effect cream is specially formulated to smooth out the skin tone progressively reducing spot coloration and increasing luminosity, while also preventing the appearance of fine wrinkles and expression lines.',
                'category_slug' => 'body-cream',
                'all_categories' => ['body-cream', 'creams', 'fast-selling-cream', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/2.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Ebony cream 500g',
                'slug' => 'ebony-cream-500g',
                'sku' => 'DSL-103',
                'price' => 55.99,
                'sale_price' => null,
                'short_description' => 'Dansolam Ebony Cream\n\n\n\nA rich, natural formula designed for every skin tone; Dansolam Ebony Cream restores softness, boosts radiance, and keeps skin beautifully balanced, and enhance all skin types with deep, lasting moisture.',
                'description' => 'Dansolam Ebony Cream\n\n\n\nA rich, natural formula designed for every skin tone; Dansolam Ebony Cream restores softness, boosts radiance, and keeps skin beautifully balanced, and enhance all skin types with deep, lasting moisture.',
                'category_slug' => 'body-cream',
                'all_categories' => ['body-cream', 'creams', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/16.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Children cream 500g',
                'slug' => 'children-cream-500g',
                'sku' => 'DSL-104',
                'price' => 43.99,
                'sale_price' => null,
                'short_description' => 'Dansolam Children Cream\n\n\n\nEnriched with pure aloe vera to soothe, protect, and hydrate delicate skin naturally.\n\nSoft, calming aloe vera formula designed for sensitive young skin—nourishes, comforts, and keeps skin healthy all day.',
                'description' => 'Dansolam Children Cream\n\n\n\nEnriched with pure aloe vera to soothe, protect, and hydrate delicate skin naturally.\n\nSoft, calming aloe vera formula designed for sensitive young skin—nourishes, comforts, and keeps skin healthy all day.',
                'category_slug' => 'body-cream',
                'all_categories' => ['body-cream', 'children-cream', 'creams', 'kids'],
                'images' => ['/storage/products/7.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Whitening Polish Soap 750ml',
                'slug' => 'whitening-polish-soap-750ml',
                'sku' => 'DSL-105',
                'price' => 59.99,
                'sale_price' => null,
                'short_description' => 'Whitening polish (strong)',
                'description' => 'Whitening polish (strong) this product is a combination of organic ingredients that purify/exfoliate the pores also moisturize your skin. For best results on your skin don’t miss out on this polish whitening saop every woman needs it for flawless and glowing skin. (Results in 5days )',
                'category_slug' => 'body-polish',
                'all_categories' => ['body-polish', 'body-soap', 'soaps', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/14.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Body and face scrub 500g',
                'slug' => 'body-and-face-scrub-500g',
                'sku' => 'DSL-106',
                'price' => 33.99,
                'sale_price' => null,
                'short_description' => 'Body and face scrub',
                'description' => 'Body and face scrub.. Perfect for all skin type..\n\n\n\nOur exfoliating scrub is ?% Organic ingredients which help to clarify blockage and reduce the appearance of enlarged pores.\n\n\n\nit also removes surface oil and dead skin cells..\n\n\n\nGentle touch for weekly use, skin feels soft and smooth always ...',
                'category_slug' => 'body-scrub',
                'all_categories' => ['body-scrub', 'scrubs'],
                'images' => ['/storage/products/15.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Essential Oil 250g',
                'slug' => 'essential-oil-250g',
                'sku' => 'DSL-107',
                'price' => 33.99,
                'sale_price' => null,
                'short_description' => 'For all skin type, suitable for men, women and children',
                'description' => 'For all skin type, suitable for men, women and children.\n\n\n\nRemoves eczema, rashes and all.\n\n\n\nAntibacterial leaving the skin smooth and glowing\n\n\n\nAll Natural ingredients 100%\n\n\n\n',
                'category_slug' => 'kids',
                'all_categories' => ['kids', 'oils', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/24.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Discoloration Oil 250g',
                'slug' => 'discoloration-oil-250g',
                'sku' => 'DSL-108',
                'price' => 40.99,
                'sale_price' => null,
                'short_description' => 'Dansolam Discoloration Oil\n\n\n\nBold & Straightforward\n\n\n\n\n\nFast-acting discoloration oil with pure almond extract and organic herbs. Targets dark spots, boosts clarity, and leaves skin visibly brighter. Looking Good Is Our Pride',
                'description' => 'Dansolam Discoloration Oil\n\n\n\nBold & Straightforward\n\n\n\n\n\nFast-acting discoloration oil with pure almond extract and organic herbs. Targets dark spots, boosts clarity, and leaves skin visibly brighter. Looking Good Is Our Pride',
                'category_slug' => 'kids',
                'all_categories' => ['kids', 'oils', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/22.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Glowing Black Soap (New Formula) 500g',
                'slug' => 'glowing-black-soap-new-formula-500g',
                'sku' => 'DSL-109',
                'price' => 26.99,
                'sale_price' => null,
                'short_description' => 'Glowing Soap',
                'description' => 'Dansolam Glowing Black Soap cleanses, brightens, and smooths the skin with natural herbal ingredients.',
                'category_slug' => 'body-soap',
                'all_categories' => ['body-soap', 'soaps', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/Untitled-design13.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 SET (Whitening Cream  Whitening Polish Soap and Scrub)',
                'slug' => '3-set-whitening-cream-whitening-polish-soap-and-scrub',
                'sku' => 'DSL-110',
                'price' => 200.99,
                'sale_price' => null,
                'short_description' => 'Whitening cream\n\nWhitening body polish and scrub',
                'description' => '',
                'category_slug' => 'body-cream',
                'all_categories' => ['body-cream', 'body-scrub', 'creams', 'scrubs', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/13.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 SET (Whitening polish Soap Glowing moisturizing and scrub)',
                'slug' => '3-set-whitening-polish-soap-glowing-moisturizing-and-scrub',
                'sku' => 'DSL-111',
                'price' => 157.99,
                'sale_price' => 142.99,
                'short_description' => 'Whitening body polish\n\nGlowing moisturizing and scrub',
                'description' => 'Whitening body polish\n\nGlowing moisturizing and scrub',
                'category_slug' => 'body-cream',
                'all_categories' => ['body-cream', 'body-scrub', 'scrubs', 'soaps'],
                'images' => ['/storage/products/8.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Glowing Black Soap(New Formula) 250g',
                'slug' => 'glowing-black-soap-new-formula-250g',
                'sku' => 'DSL-112',
                'price' => 23.99,
                'sale_price' => null,
                'short_description' => '',
                'description' => '',
                'category_slug' => 'soaps',
                'all_categories' => ['soaps', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/Untitled-design13.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 SET (Ebony cream Glowing Black Soap and scrub )',
                'slug' => '3-set-ebony-cream-glowing-black-soap-and-scrub',
                'sku' => 'DSL-113',
                'price' => 124.99,
                'sale_price' => null,
                'short_description' => '\n\n\n \n\n\n\nEbony cream\n\nGlowing Soap and scrub',
                'description' => 'Ebony cream\n\nGlowing Soap and scrub',
                'category_slug' => '3-set',
                'all_categories' => ['3-set', 'creams', 'scrubs', 'soaps', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/6.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '2 SET Discoloration oil & scrub (Perfect for all skin)',
                'slug' => '2-set-discoloration-oil-scrub-perfect-for-all-skin',
                'sku' => 'DSL-114',
                'price' => 72.99,
                'sale_price' => null,
                'short_description' => 'Perfect for dark skin.',
                'description' => 'Essential oil & scrub',
                'category_slug' => 'body-scrub',
                'all_categories' => ['body-scrub', 'oils', 'scrubs'],
                'images' => ['/storage/products/Untitled-design10.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 SET (Discoloration Oil,  Whitening Body Polish Soap and Scrub)',
                'slug' => '3-set-discoloration-oil-whitening-body-polish-soap-and-scrub',
                'sku' => 'DSL-115',
                'price' => 135.99,
                'sale_price' => null,
                'short_description' => '3 SET (Essential Oil, Whitening Body Polish and Scrub)',
                'description' => '3 SET (Essential Oil, Whitening Body Polish and Scrub)',
                'category_slug' => '3-set',
                'all_categories' => ['3-set', 'scrubs', 'soaps', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/Untitled-design11.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '2 SET (Children Cream and Sugar Scrub)',
                'slug' => '2-set-children-cream-and-sugar-scrub',
                'sku' => 'set',
                'price' => 80.99,
                'sale_price' => null,
                'short_description' => '2 SET (Children Cream and Sugar Scrub)',
                'description' => '2 SET (Children Cream and Sugar Scrub)',
                'category_slug' => '2-set',
                'all_categories' => ['2-set', 'children-cream', 'creams', 'kids', 'scrubs'],
                'images' => ['/storage/products/11.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Children cream and Glowing Black Soap 250g',
                'slug' => 'children-cream-and-glowing-black-soap-250g',
                'sku' => 'DSL-117',
                'price' => 66.99,
                'sale_price' => null,
                'short_description' => 'Children cream and Glowing Soap',
                'description' => 'Children cream and Glowing Soap',
                'category_slug' => '2-set',
                'all_categories' => ['2-set', 'body-soap', 'children-cream', 'creams', 'kids'],
                'images' => ['/storage/products/12.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 SET (Glowing Moisturizing Cream, Glowing Black Soap 500g and Scrub)',
                'slug' => '3-set-glowing-moisturizing-cream-glowing-black-soap-500g-and-scrub',
                'sku' => 'DSL-118',
                'price' => 153.99,
                'sale_price' => null,
                'short_description' => '3 SET (Glowing Moisturizing, Whitening and Scrub)',
                'description' => '3 SET (Glowing Moisturizing, Whitening and Scrub)',
                'category_slug' => '3-set',
                'all_categories' => ['3-set', 'creams', 'scrubs', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/Untitled-design12.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Dansolam plus (molato) 500g',
                'slug' => 'dansolam-plus-molato-500g',
                'sku' => 'soap',
                'price' => 52.99,
                'sale_price' => null,
                'short_description' => 'Dansolam plus (molato)\n\n\n\nTreats all kinds …\n\n\n\nStretch marks\n\n\n\nWrinkles\n\n\n\nDark spots/ Discoloration\n\n\n\nPimples\n\n\n\nSunburn Dull skin/ patches\n\n\n\nEczem etc ..\n\n\n\nlooking Good Is our Pride!',
                'description' => 'Dansolam Plus (molato) Soap\n\n\n\n"Tired of dark spots and white patches? Try Dansolam Plus Molato Soap for a visibly clearer and brighter complexion."\n\n\n\n"DPM Soap is your natural solution for smooth, even-toned, and glowing skin."\n\n\n\n"Made with powerful skin-loving ingredients to fade spots, reduce discolouration, and enhance your skin’s beauty."\n\n\n\n"Feel the difference in days – gentle on skin, tough on blemishes."\n\n\n\nIt\'s a Luxury BLACK SOAP, it\'s very rich and highly effective!!!!!!!\n\n\n\nPerfect for Men & Women for glowing skin, avoiding ageing irritation, natural shade, also it exfoliates & moisturises, fades off burns. etc\n\n\n\n\n\nOrganic, Zero chemicals\n\n\n\n\n\nIngredients... Kojic dip, vitamins C, papaya extract & other natural Organic!!!',
                'category_slug' => 'body-soap',
                'all_categories' => ['body-soap', 'face-soap', 'soaps', 'women-men-lighter-complexion', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/17-1.png', '/storage/products/dans0lam-plus-face-and-b0dy.jpg'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Foot cream Solution (New)50g',
                'slug' => 'foot-cream-solution-new-50g',
                'sku' => 'DSL-120',
                'price' => 11.99,
                'sale_price' => null,
                'short_description' => 'Dansolam Foot Solution\n\n\n\nFor Dry, Cracked, Rough and Heels feet with Aloe .\n\n\n\nINGREDIENTS: Aloe barbadensis, chloroxylenol,hydroxide, glycerin, disodium EDTA and (water) Aqua etc.',
                'description' => 'Dansolam Foot Solution Helps moisture, soften Dry, Cracked and tired feet. it rejuvenate sore and stop itching due to dry skin .\n\n\n\nTake a little amount of cream and apply over feet, between toes and under the feet area massage until completely absorbed. Adults and children age 4 and older apply 3 or 4 times daily for 4 to 5 days .\n\n\n\nAfterwards, use daily to maintain soft and healthy feet.\n\n\n\n KEEP OUT OF REACH OF CHILDREN AND AVOID CONTACT WITH EYES .FOR EXTERNAL USE ONLY !',
                'category_slug' => 'foot-cream',
                'all_categories' => ['creams', 'foot-cream'],
                'images' => ['/storage/products/26.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 Set of Essential Oil 250g Each',
                'slug' => '3-set-of-essential-oil-250g-each',
                'sku' => 'DSL-121',
                'price' => 97.99,
                'sale_price' => null,
                'short_description' => '3 set of Essential oil',
                'description' => '3 Set of Essential Oil\n\n\n\nFor all skin type, suitable for men, women and children.\n\n\n\nRemoves eczema, rashes and all.\n\n\n\nAntibacterial leaving the skin smooth and glowing\n\n\n\nAll Natural ingredients 100%',
                'category_slug' => 'oils',
                'all_categories' => ['oils', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/19.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => '3 Set of Decorations Oil 250g Each',
                'slug' => '3-set-of-decorations-oil-250g-each',
                'sku' => 'DSL-122',
                'price' => 112.99,
                'sale_price' => null,
                'short_description' => 'This one 3 set of decorations oil',
                'description' => 'Luxury & Natural\n\nA premium blend of almond oil and organic herbs designed to fade discoloration, even skin tone, and reveal a naturally glowing, flawless finish.',
                'category_slug' => 'oils',
                'all_categories' => ['oils', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/20.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Dansolam Plus (HerbaGlow Max) 500g New',
                'slug' => 'dansolam-plus-herbaglow-max-500g-new',
                'sku' => 'DSL-123',
                'price' => 56.99,
                'sale_price' => null,
                'short_description' => '"Say goodbye to dark spots, white patches, and uneven skin tone with Dansolam Plus (HerbalGlow Max)– the powerful soap that restores your skin’s natural glow. Clear, smooth, radiant skin starts here – grab yours now!"\n\n\n\nTreats all kin...',
                'description' => '"Say goodbye to dark spots, white patches, and uneven skin tone with Dansolam Plus (HerbalGlow Max)– the powerful soap that restores your skin’s natural glow. Clear, smooth, radiant skin starts here – grab yours now!"\n\n\n\nTreats all kinds ...\n\n\n\n"Reveal your true glow."\n\n\n\n"Clear skin, confident you."\n\n\n\n"From patchy to perfect – naturally."\n\n\n\n"Glow starts here."\n\n\n\n"Say goodbye to skin discoloration."\n\n\n\n"Your skin deserves better."\n\n\n\n"Glow boldly with every wash."\n\n\n\n"Smooth. Even. Radiant."\n\n\n\nPerfect for Men & Women for glowing skin, avoiding ageing irritation, natural shade, also it exfoliates & moisturises, fades off burns. etc\n\n\n\n Organic, Zero chemicals.',
                'category_slug' => 'body-soap',
                'all_categories' => ['body-soap', 'face-soap', 'fast-selling-soap', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/4.png'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Whitening Shower Gel 750ml',
                'slug' => 'whitening-shower-gel-750ml',
                'sku' => 'Gel',
                'price' => 73.99,
                'sale_price' => 53.99,
                'short_description' => 'Dansolam whitening shower gel is recommended for a lighter skin, strong and effective removal of dark spots, lighting the skin result in few days with a Golden skin.\n\n\n\n\n\n\n\nplace your order now product coming soon! \n\n\n\nYou can\'t go...',
                'description' => 'Whitening shower gel 750g\n\n\n\nReveal brighter, smoother skin with our Whitening Shower Gel. Infused with natural extracts, it gently cleanses, exfoliates, and helps even out skin tone. The rich, creamy lather nourishes and hydrates, leaving your skin refreshed, soft, and visibly radiant with every use.',
                'category_slug' => 'body-soap',
                'all_categories' => ['body-soap', 'fast-selling-soap', 'soaps', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/Untitled-design14.png', '/storage/products/Untitled-design14.png'],
                'is_featured' => false,
                'is_new_arrival' => false,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Dansolam Face Cream ( Glowing & Spots  Remover With SPF) 30g NEW',
                'slug' => 'dansolam-face-cream-glowing-spots-remover-with-spf-30g-new',
                'sku' => 'DSL-125',
                'price' => 17.99,
                'sale_price' => null,
                'short_description' => 'Dansolam Glowing & Spot Remover Face Cream .\n\n\n\nIntense Toning treatment cream,\n\n\n\nPerfect Under Sunshine Day & Night use.\n\n\n\nWith SPF 30\n\n\n\nGive it a try, and thank us later .\n\n\n\nLooking Good Is Our Pride!',
                'description' => 'Dansolam Glowing & Spot Remover Face Cream .\n\n\n\nIntense Toning treatment cream,\n\n\n\nPerfect Under Sunshine Day & Night use.\n\n\n\nWith SPF 30\n\n\n\nGive it a try, and thank us later .\n\n\n\nLooking Good Is Our Pride!',
                'category_slug' => 'women-men-lighter-complexion',
                'all_categories' => ['creams', 'women-men-lighter-complexion', 'women-men-chocolate-complexion'],
                'images' => ['/storage/products/28.png'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Action oil (Face & Body)30g',
                'slug' => 'action-oil-face-body-30g',
                'sku' => 'DSL-126',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'Dansolam 7 days action oil is not just an ordinary oil the benefits are unbelievable but true \n\n\n\nAction oil help rejuvenate your skin, peel your dead and old skin, improves skin elasticity and reduce the look of dark spots. Skin will ...',
                'description' => 'Dansolam 7 days action oil is not just an ordinary oil the benefits are unbelievable but true \n\n\n\nAction oil help rejuvenate your skin, peel your dead and old skin, improves skin elasticity and reduce the look of dark spots. Skin will peel off naturally. *DO NOT FORCE OUT *\n\n\n\n**DO NOT USE SCRUB ON THE AREA APPLIED**\n\n\n\n\n\n\n\nIngredients\n\n\n\nSALICYLIC ACID\n\n\n\nPEG-400\n\n\n\nGLYCERIN\n\n\n\nTAURINE\n\n\n\nMATRICARIA) FLOWER EXTRACT\n\n\n\n(ROSEMARY) LEAF EXTRACT\n\n\n\nETC\n\n\n\n\n\nLooking Good Is Our Pride!',
                'category_slug' => 'oils',
                'all_categories' => ['oils'],
                'images' => ['/storage/products/27.png'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Extract Herbal Skin Lightening Soap',
                'slug' => 'extract-herbal-skin-lightening-soap',
                'sku' => 'DSL-127',
                'price' => 3.99,
                'sale_price' => null,
                'short_description' => 'Herbal extract formula that helps brighten and refresh the skin naturally.',
                'description' => 'Herbal extract formula that helps brighten and refresh the skin naturally.',
                'category_slug' => 'soaps',
                'all_categories' => ['soaps', 'women-men-lighter-complexion'],
                'images' => ['/storage/products/29.png'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Crimson Petal (10g)',
                'slug' => 'crimson-petal-10g',
                'sku' => 'DSL-128',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'A rich, romantic blend that clings to your skin and clothes for days. Crimson Petal is elegance that lingers long after you’ve left the room.',
                'description' => 'A rich, romantic blend that clings to your skin and clothes for days. Crimson Petal is elegance that lingers long after you’ve left the room.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0035.jpg', '/storage/products/IMG-20250730-WA0035.jpg', '/storage/products/IMG-20250730-WA0032.jpg', '/storage/products/IMG-20250730-WA0033.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Lustra (10g)',
                'slug' => 'lustra-10g',
                'sku' => 'DSL-129',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'Light, golden, and radiant, Lustra shines in summer heat or cool winds, staying fresh and captivating on skin and clothes for days.',
                'description' => 'Light, golden, and radiant, Lustra shines in summer heat or cool winds, staying fresh and captivating on skin and clothes for days.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0037.jpg', '/storage/products/IMG-20250730-WA0029.jpg', '/storage/products/IMG-20250730-WA0037.jpg', '/storage/products/IMG-20250731-WA0009.jpg', '/storage/products/IMG-20250731-WA0011.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Essenza (10ml)',
                'slug' => 'essenza-10ml',
                'sku' => 'DSL-130',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'Pure, clean, and effortlessly luxurious. Essenza is the scent that stays with you, even through the hottest days or breeziest nights.',
                'description' => 'Pure, clean, and effortlessly luxurious. Essenza is the scent that stays with you, even through the hottest days or breeziest nights.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0034.jpg', '/storage/products/IMG-20250730-WA0034.jpg', '/storage/products/IMG-20250731-WA0012.jpg', '/storage/products/IMG-20250730-WA0011.jpg', '/storage/products/IMG-20250730-WA0014.jpg', '/storage/products/IMG-20250730-WA0026.jpg', '/storage/products/IMG-20250730-WA0027.jpg', '/storage/products/IMG-20250730-WA0030.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Oleya (10g)',
                'slug' => 'oleya-10g',
                'sku' => 'DSL-131',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'Warm, airy, and deeply sensual, Oleya melts into your skin and fabric, lasting beautifully through sunlit days and windy evenings.',
                'description' => 'Warm, airy, and deeply sensual, Oleya melts into your skin and fabric, lasting beautifully through sunlit days and windy evenings.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0044.jpg', '/storage/products/IMG-20250730-WA0048.jpg', '/storage/products/IMG-20250730-WA0044.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Earthy & Natural (10g)',
                'slug' => 'earthy-natural-10g',
                'sku' => 'DSL-132',
                'price' => 18.99,
                'sale_price' => null,
                'short_description' => 'Crisp, clean, and grounded—this fresh scent blends perfectly with summer air or earthy winds, staying true on your skin and clothes for days.',
                'description' => 'Crisp, clean, and grounded—this fresh scent blends perfectly with summer air or earthy winds, staying true on your skin and clothes for days.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0018.jpg', '/storage/products/IMG-20250730-WA0022.jpg', '/storage/products/IMG-20250730-WA0017.jpg', '/storage/products/IMG-20250730-WA0015.jpg', '/storage/products/IMG-20250730-WA0018.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Wild Bloom (10g)',
                'slug' => 'wild-bloom-10g',
                'sku' => 'DSL-133',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'Bursting with life and colour, Wild Bloom is your perfect companion in warm winds and sunny days, lingering with a floral charm that lasts.',
                'description' => 'Bursting with life and colour, Wild Bloom is your perfect companion in warm winds and sunny days, lingering with a floral charm that lasts.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0021.jpg', '/storage/products/IMG-20250730-WA0020.jpg', '/storage/products/IMG-20250730-WA0021.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Desert Mirage (10g) Fast Selling',
                'slug' => 'desert-mirage-10g-fast-selling',
                'sku' => 'DSL-134',
                'price' => 19.99,
                'sale_price' => null,
                'short_description' => 'Mystical and captivating. Desert Miraga lingers like a dream, long-lasting, bold, and unforgettable on both skin and fabric.',
                'description' => 'Mystical and captivating. Desert Miraga lingers like a dream, long-lasting, bold, and unforgettable on both skin and fabric.',
                'category_slug' => 'perfume-fragrances',
                'all_categories' => ['perfume-fragrances'],
                'images' => ['/storage/products/IMG-20250730-WA0036.jpg', '/storage/products/IMG-20250730-WA0043.jpg', '/storage/products/IMG-20250730-WA0042.jpg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Herbal Balm',
                'slug' => 'herbal-balm',
                'sku' => 'DSL-135',
                'price' => 4.99,
                'sale_price' => null,
                'short_description' => 'GOLDEN HERBAL MIXTURE BALM\n\n\nGolden herbal mixture balm  contains 10 ingredients and works effectively for all forms of inflamations, pains, rhematism and arthiritis.',
                'description' => 'GOLDEN HERBAL MIXTURE BALM\n\n\nGolden herbal mixture balm  contains 10 ingredients and works effectively for all forms of inflamations, pains, rhematism and arthiritis.',
                'category_slug' => 'balm-ointment',
                'all_categories' => ['balm-ointment'],
                'images' => ['/storage/products/WhatsApp-Image-2025-12-05-at-01.53.39-1.jpeg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Golden Herbal Mixture',
                'slug' => 'golden-herbal-mixture',
                'sku' => 'DSL-136',
                'price' => 16.50,
                'sale_price' => null,
                'short_description' => 'GOLDEN HERBAL MIXTURE:\n\n\n\n\n\nGolden herb mixture works effectively\n\n\n\n\n\n* For Insomnia.\n\n* Improves and prevent memory loss.\n\n* Enhances clarity of eye sight.\n\n* It manages dry cough, asthmatic cough, whopping cough and other bro...',
                'description' => 'GOLDEN HERBAL MIXTURE:\n\n\n\n\n\nGolden herb mixture works effectively\n\n\n\n\n\n* For Insomnia.\n\n* Improves and prevent memory loss.\n\n* Enhances clarity of eye sight.\n\n* It manages dry cough, asthmatic cough, whopping cough and other bronchial related diseases.\n\n* It manages heart related diseases-Atherosclerosis,       hypertention and high blood preasure.\n\n* It gradually shrinks fibroid and manages prostrate enlargement issues.\n\n* It helps cures stomach related ilnesses - stomache ache, diarrhea, constipation.\n\n* It helps in kidney, urinary, bladder, liver and pancreatic diseases.\n\n* It cures all erectile dysfunction related diseases, sexual improvement, improves fertility in both men and women.\n\n* Golden herbal mixture is a natural tonic, a body cleanser, removes bad cholesterol, toxic, bacterials and free radicals from the body.',
                'category_slug' => 'herbs',
                'all_categories' => ['herbs'],
                'images' => ['/storage/products/WhatsApp-Image-2025-12-05-at-01.53.25.jpeg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
            [
                'name' => 'Golden Herbal Mixture (Pack of 6 bottles of herbal drink and one bottle of eye drop)',
                'slug' => 'golden-herbal-mixture-pack-of-6-bottles-of-herbal-drink-and-one-bottle-of-eye-drop',
                'sku' => 'DSL-137',
                'price' => 85.99,
                'sale_price' => null,
                'short_description' => 'GOLDEN HERBAL MIXTURE:\n\n\n\nGolden herb mixture works effectively\n\n\n\n* For Insomnia.\n\n\n\n* Improves and prevent memory loss.\n\n\n\n* Enhances clarity of eye sight.\n\n\n\n* It manages dry cough, asthmatic cough, whopping cough and other ...',
                'description' => 'GOLDEN HERBAL MIXTURE:\n\n\n\nGolden herb mixture works effectively\n\n\n\n* For Insomnia.\n\n\n\n* Improves and prevent memory loss.\n\n\n\n* Enhances clarity of eye sight.\n\n\n\n* It manages dry cough, asthmatic cough, whopping cough and other bronchial related diseases.\n\n\n\n* It manages heart related diseases-Atherosclerosis, hypertention and high blood preasure.\n\n\n\n* It gradually shrinks fibroid and manages prostrate enlargement issues.\n\n\n\n* It helps cures stomach related ilnesses - stomache ache, diarrhea, constipation.\n\n\n\n* It helps in kidney, urinary, bladder, liver and pancreatic diseases.\n\n\n\n* It cures all erectile dysfunction related diseases, sexual improvement, improves fertility in both men and women.\n\n\n\n* Golden herbal mixture is a natural tonic, a body cleanser, removes bad cholesterol, toxic, bacterials and free radicals from the body.\n\n\n\n\n\n\n\nGOLDEN HERBAL EYE DROP\n\n\n\nGolden herbal mixture is a combo with the mixture. It works effectively for glaucoma, cataract and all forms of eyes infection.',
                'category_slug' => 'herbs',
                'all_categories' => ['herbs'],
                'images' => ['/storage/products/WhatsApp-Image-2025-12-05-at-01.53.25.jpeg'],
                'is_featured' => false,
                'is_new_arrival' => true,
                'is_best_seller' => false,
            ],
        ];

        $sanitizeText = function ($text) {
            if (!$text) return '';
            $text = str_replace(['\r\n', '\n', '\r', '\\n', '\\r'], "\n", $text);
            $text = trim($text, " \t\n\r\0\x0B\"");
            $text = preg_replace("/\n{3,}/", "\n\n", $text);
            return trim($text);
        };

        foreach ($productsData as $pData) {
            $cleanDesc = $sanitizeText($pData['description'] ?? '');
            $cleanShortDesc = $sanitizeText($pData['short_description'] ?? '');

            $product = Product::create([
                'ecommerce_id' => $ecommerce->id,
                'name' => $pData['name'],
                'slug' => $pData['slug'],
                'sku' => $pData['sku'],
                'description' => $cleanDesc,
                'short_description' => mb_substr($cleanShortDesc, 0, 240),
                'price' => $pData['price'],
                'sale_price' => $pData['sale_price'],
                'cost_price' => $pData['price'] * 0.5,
                'status' => 'published',
                'is_featured' => $pData['is_featured'],
                'is_new_arrival' => $pData['is_new_arrival'],
                'is_best_seller' => $pData['is_best_seller'],
                'has_variants' => false,
                'stock_quantity' => 50,
                'low_stock_threshold' => 5,
                'seo_title' => mb_substr($pData['name'], 0, 100) . ' | Dansolam Beauty Home',
                'seo_description' => mb_substr($cleanShortDesc, 0, 240),
            ]);

            // Attach categories & matching collections
            foreach ($pData['all_categories'] as $cSlug) {
                if (isset($categories[$cSlug])) {
                    $product->categories()->syncWithoutDetaching([$categories[$cSlug]->id]);
                }
            }

            foreach ($collectionsData as $colInfo) {
                foreach ($pData['all_categories'] as $cSlug) {
                    if (in_array($cSlug, $colInfo['category_slugs']) && isset($collections[$colInfo['slug']])) {
                        $product->collections()->syncWithoutDetaching([$collections[$colInfo['slug']]->id]);
                    }
                }
            }

            // Attach images
            foreach ($pData['images'] as $idx => $imgUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $imgUrl,
                    'sort_order' => $idx,
                ]);
            }

            // Create default single variant
            ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $product->sku . '-STD',
                'size' => 'Standard',
                'color' => 'Default',
                'price' => $product->price,
                'sale_price' => $product->sale_price,
                'stock_quantity' => 50,
                'low_stock_threshold' => 5,
                'image_url' => $pData['images'][0] ?? null,
                'status' => 'active',
            ]);
        }

        $this->call(FaqSeeder::class);
        // ArticleSeeder holds placeholder posts; run it manually for demo data only.
        $this->call(BannerSeeder::class);
        $this->call(StorefrontContentSeeder::class);
        $this->call(ShippingRulesSeeder::class);
    }
}
