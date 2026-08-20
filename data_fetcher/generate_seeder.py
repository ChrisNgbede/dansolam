import csv
import os
import re
import json

csv_path = '/Users/chrisngbede/Desktop/laravel/dansolam/wc-product-export-20-7-2026-1784528035786.csv'
seeder_path = '/Users/chrisngbede/Desktop/laravel/dansolam/database/seeders/DatabaseSeeder.php'

def clean_text(text):
    if not text:
        return ''
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ').replace('⭐', '').replace('💖', '').replace('❤️', '').replace('💕', '').replace('💯', '').replace('⚠️', '')
    return text.strip()

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

categories_map = {}
products = []

idx = 100
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = clean_text(row.get('Name', ''))
        if not name:
            continue
        
        idx += 1
        raw_sku = row.get('SKU', '').strip()
        if raw_sku and raw_sku != 'None':
            sku = raw_sku
        else:
            wc_id = row.get('ID', '').strip()
            if wc_id and wc_id != 'None':
                sku = f"DSL-{wc_id}"
            else:
                sku = f"DSL-{idx}"
        
        reg_price = row.get('Regular price', '').strip()
        sale_price = row.get('Sale price', '').strip()
        
        try:
            price_val = float(reg_price) if reg_price else 25000.0
        except ValueError:
            price_val = 25000.0
            
        try:
            sale_val = float(sale_price) if sale_price else None
        except ValueError:
            sale_val = None

        short_desc = clean_text(row.get('Short description', ''))
        desc = clean_text(row.get('Description', ''))
        if not short_desc:
            short_desc = desc
        if len(short_desc) > 240:
            short_desc = short_desc[:237] + '...'

        cats_raw = row.get('Categories', '')
        cat_names = [clean_text(c) for c in cats_raw.split(',') if clean_text(c)]
        
        primary_cat_slug = 'creams'
        for cat in cat_names:
            c_slug = slugify(cat)
            categories_map[c_slug] = cat
            if primary_cat_slug == 'creams':
                primary_cat_slug = c_slug

        imgs_raw = row.get('Images', '')
        img_urls = [i.strip() for i in imgs_raw.split(',') if i.strip()]
        local_imgs = []
        for img_url in img_urls:
            filename = os.path.basename(img_url.split('?')[0])
            if filename:
                local_imgs.append(f"/storage/products/{filename}")
        
        if not local_imgs:
            local_imgs = ['/images/products/placeholder.jpg']

        products.append({
            'name': name,
            'slug': slugify(name),
            'sku': sku if sku else f"DSL-{row.get('ID')}",
            'price': price_val,
            'sale_price': sale_val,
            'short_description': short_desc,
            'description': desc,
            'category_slug': primary_cat_slug,
            'all_categories': [slugify(c) for c in cat_names],
            'images': local_imgs,
            'is_featured': row.get('Is featured?') == '1',
            'is_new_arrival': 'New' in row.get('Tags', '') or '2024' in row.get('Images', '') or '2025' in row.get('Images', ''),
            'is_best_seller': 'Fast selling' in name or 'Fast selling' in desc,
        })

print(f"Loaded {len(products)} products and {len(categories_map)} categories.")

categories_array_str = "[\n"
for slug, name in categories_map.items():
    categories_array_str += f"            ['name' => '{name}', 'slug' => '{slug}', 'image_url' => '/images/categories/skincare.jpg'],\n"
categories_array_str += "        ]"

php_code = f"""<?php

namespace Database\\Seeders;

use App\\Models\\User;
use App\\Models\\Ecommerce;
use App\\Models\\EcommerceSetting;
use App\\Models\\Category;
use App\\Models\\Collection;
use App\\Models\\Product;
use App\\Models\\ProductVariant;
use App\\Models\\ProductImage;
use App\\Models\\DeliveryZone;
use App\\Models\\Banner;
use App\\Models\\Page;
use App\\Models\\Review;
use App\\Models\\Customer;
use App\\Models\\CustomerAddress;
use App\\Models\\Order;
use App\\Models\\OrderItem;
use App\\Models\\Payment;
use App\\Models\\Coupon;
use App\\Models\\Discount;
use App\\Models\\Tax;
use App\\Models\\ShippingRate;
use App\\Models\\ProductTag;
use App\\Models\\Article;
use App\\Models\\BlogCategory;
use App\\Models\\BlogTag;
use App\\Models\\BlogComment;
use App\\Models\\GalleryItem;
use App\\Models\\ContactInquiry;
use App\\Models\\InventoryLog;
use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Support\\Str;
use Illuminate\\Support\\Facades\\DB;

class DatabaseSeeder extends Seeder
{{
    public function run(): void
    {{
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
            'whatsapp_number' => '2348000000000',
            'store_address' => 'Dansolam Beauty Home, Abuja, Nigeria',
            'opening_hours' => 'Monday-Saturday: 9:00 AM - 6:00 PM',
            'currency' => 'NGN',
            'delivery_coverage' => 'Abuja, Nationwide, Worldwide delivery',
            'bank_name' => 'Access Bank',
            'bank_account_number' => '1234567890',
            'bank_account_name' => 'Dansolam Beauty Home Ltd',
            'return_policy' => 'We accept returns within 7 days of delivery for unused products in original packaging.',
            'privacy_policy' => 'We respect your privacy. We collect your name, phone number, email, and address to process your orders securely.',
            'terms_conditions' => 'By shopping with us, you agree to our terms. Payments must be verified before delivery.',
            'shipping_base_domestic' => '2000',
            'shipping_same_day_surcharge' => '5000',
            'shipping_international_base' => '25000',
            'shipping_free_threshold' => '100000',
            'shipping_item_multiplier' => '1500',
            'payment_gateway_active' => 'paystack',
            'paystack_key_public' => 'pk_test_mock123456789',
            'paystack_key_secret' => 'sk_test_mock123456789',
            'flutterwave_key_public' => 'flw_test_mock123456789',
            'flutterwave_key_secret' => 'flw_secret_mock123456789',
            'cod_enabled' => 'true',
            'announcement_show' => 'true',
            'announcement_text' => 'Free delivery on orders above N100,000! International postage: items more than 3 will be charged more.',
            'promo_popup_show' => 'true',
            'promo_popup_title' => 'Welcome to Dansolam Beauty Home',
            'promo_popup_body' => '<p>Subscribe to our newsletter for <strong>exclusive skincare offers</strong> and beauty tips!</p>',
            'promo_popup_image' => '/images/popup-banner.jpg',
            'promo_popup_delay' => '5000',
            'show_gallery_page' => 'true',
            'show_blog_page' => 'true',
            'sold_count_enabled' => 'true',
            'sku_prefix' => 'DSL-',
            'sku_suffix' => '',
            'system_currency_code' => 'NGN',
            'system_currency_symbol' => '₦',
            'system_timezone' => 'Africa/Lagos',
        ];

        foreach ($settings as $key => $value) {{
            EcommerceSetting::updateOrCreate(
                ['ecommerce_id' => $ecommerce->id, 'key' => $key],
                ['value' => $value]
            );
        }}

        // 4. Categories
        $categoriesData = {categories_array_str};

        $categories = [];
        foreach ($categoriesData as $c) {{
            $categories[$c['slug']] = Category::updateOrCreate(
                ['slug' => $c['slug']],
                ['name' => $c['name'], 'image_url' => $c['image_url'], 'is_visible' => true]
            );
        }}

        // 5. Collections
        $collectionsData = [
            ['name' => 'Fast Selling Creams', 'slug' => 'fast-selling-creams', 'banner_url' => '/images/collections/creams.jpg'],
            ['name' => 'Organic Soaps & Polishes', 'slug' => 'organic-soaps-polishes', 'banner_url' => '/images/collections/soaps.jpg'],
            ['name' => 'Body & Face Scrubs', 'slug' => 'body-face-scrubs', 'banner_url' => '/images/collections/scrubs.jpg'],
            ['name' => 'Essential & Discoloration Oils', 'slug' => 'essential-discoloration-oils', 'banner_url' => '/images/collections/oils.jpg'],
            ['name' => 'Luxury Sets & Bundles', 'slug' => 'luxury-sets-bundles', 'banner_url' => '/images/collections/sets.jpg'],
            ['name' => 'Perfume & Fragrances', 'slug' => 'perfume-fragrances', 'banner_url' => '/images/collections/perfumes.jpg'],
        ];

        $collections = [];
        foreach ($collectionsData as $col) {{
            $collections[$col['slug']] = Collection::updateOrCreate(
                ['slug' => $col['slug']],
                ['name' => $col['name'], 'banner_url' => $col['banner_url'], 'is_published' => true]
            );
        }}

        // 6. Delivery Zones
        $deliveryZones = [
            ['name' => 'Abuja Delivery (Local)', 'shipping_fee' => 2000, 'estimated_days' => '1-2 Days'],
            ['name' => 'Nationwide Delivery (Nigeria)', 'shipping_fee' => 5000, 'estimated_days' => '3-5 Days'],
            ['name' => 'Worldwide Delivery', 'shipping_fee' => 25000, 'estimated_days' => '7-10 Days'],
            ['name' => 'Dansolam Store Pickup (Abuja)', 'shipping_fee' => 0, 'estimated_days' => 'Ready same day'],
            ['name' => 'Lagos Express Delivery', 'shipping_fee' => 3500, 'estimated_days' => '1-2 Days'],
        ];

        foreach ($deliveryZones as $zone) {{
            DeliveryZone::create($zone);
        }}

        // 7. Shipping Rates
        $shippingRates = [
            ['name' => 'Standard Domestic', 'type' => 'flat', 'rate' => 2000, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
            ['name' => 'Express Same-Day Abuja', 'type' => 'flat', 'rate' => 5000, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
            ['name' => 'International DHL Express', 'type' => 'flat', 'rate' => 25000, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'international', 'shipping_countries' => ['US', 'UK', 'CA', 'AU']],
            ['name' => 'Free Delivery (Above ₦100k)', 'type' => 'flat', 'rate' => 0, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
        ];

        foreach ($shippingRates as $rate) {{
            ShippingRate::create($rate);
        }}

        // 8. Taxes
        Tax::updateOrCreate(['name' => 'VAT (Nigeria)'], ['rate' => 7.5, 'type' => 'exclusive', 'applicable_areas' => 'all', 'is_active' => true]);

        // 9. Coupons
        $coupons = [
            ['code' => 'WELCOME10', 'type' => 'percentage', 'value' => 10, 'min_spend' => 20000, 'start_date' => now()->subDays(30), 'end_date' => now()->addDays(365), 'usage_limit' => 100, 'user_limit' => 1],
            ['code' => 'GLOW20', 'type' => 'percentage', 'value' => 20, 'min_spend' => 50000, 'start_date' => now()->subDays(5), 'end_date' => now()->addDays(10), 'usage_limit' => 50, 'user_limit' => 1],
            ['code' => 'FREEDELIVERY', 'type' => 'free_delivery', 'value' => 0, 'min_spend' => 100000, 'start_date' => now()->subDays(10), 'end_date' => now()->addDays(60), 'usage_limit' => 200, 'user_limit' => 3],
        ];
        foreach ($coupons as $coupon) {{
            Coupon::updateOrCreate(['code' => $coupon['code']], $coupon);
        }}

        // 10. Product Tags
        $productTags = [
            ['name' => 'Organic', 'label_text' => '100% Organic', 'icon' => 'leaf', 'bg_color' => '#22c55e', 'text_color' => '#ffffff'],
            ['name' => 'Fast Selling', 'label_text' => 'Fast Selling', 'icon' => 'fire', 'bg_color' => '#ef4444', 'text_color' => '#ffffff'],
            ['name' => 'New Formula', 'label_text' => 'New Formula', 'icon' => 'star', 'bg_color' => '#654687', 'text_color' => '#ffffff'],
            ['name' => 'Best Seller', 'label_text' => 'Best Seller', 'icon' => 'crown', 'bg_color' => '#f59e0b', 'text_color' => '#ffffff'],
        ];
        $tags = [];
        foreach ($productTags as $tag) {{
            $tags[$tag['name']] = ProductTag::updateOrCreate(['name' => $tag['name']], $tag);
        }}

        // 11. Banners
        Banner::updateOrCreate(['title' => 'Beauty Pronounced', 'type' => 'hero'], ['subtitle' => 'Looking Good Is Our Pride! Experience 100% organic skincare, whitening soaps, glowing creams, and luxury fragrances.', 'image_url' => '/images/hero-banner.jpg', 'link_url' => '/shop', 'is_active' => true]);
        Banner::updateOrCreate(['title' => 'Dansolam Plus (Molato)', 'type' => 'promo'], ['subtitle' => 'Treat dark spots, sunburn, white patches, and discolouration naturally.', 'image_url' => '/images/promo-banner.jpg', 'link_url' => '/shop', 'is_active' => true]);

        // 12. Pages
        $pages = [
            ['title' => 'About Us', 'slug' => 'about-us', 'content' => '<h1>About Dansolam Beauty Home</h1><p>Dansolam Beauty Home is dedicated to delivering flawless, glowing skin through 100% organic skincare products. Looking Good Is Our Pride!</p><p>Our rich formulas protect, hydrate, and rejuvenate your skin naturally with zero harmful chemicals.</p>'],
            ['title' => 'Skincare & Application Guide', 'slug' => 'size-guide', 'content' => '<h1>Skincare & Application Guide</h1><p>How to use Dansolam products for best results:</p><ul><li><strong>Whitening Polish Soap:</strong> Apply daily on face & body. Results visible in 5 days!</li><li><strong>Glowing Moisturizing Cream:</strong> Apply after bathing for 24-hour hydration.</li><li><strong>Discoloration Oil:</strong> Target dark spots and uneven skin tone twice daily.</li></ul>'],
            ['title' => 'FAQ', 'slug' => 'faq', 'content' => '<h1>Frequently Asked Questions</h1><p>Are Dansolam products organic? Yes, 100% organic with zero chemicals.</p><p>Do you ship worldwide? Yes, we deliver nationwide across Nigeria and internationally.</p>'],
            ['title' => 'Shipping & Delivery', 'slug' => 'shipping-delivery', 'content' => '<h1>Shipping & Delivery</h1><p>Abuja Local: 1-2 Days | Nationwide: 3-5 Days | International: 7-10 Days.</p>'],
            ['title' => 'Privacy Policy', 'slug' => 'privacy-policy', 'content' => '<h1>Privacy Policy</h1><p>We keep your information safe and secure when processing orders.</p>'],
        ];
        foreach ($pages as $p) {{
            Page::updateOrCreate(['slug' => $p['slug']], $p);
        }}

        // 13. Products
        Product::query()->delete();
        ProductImage::query()->delete();
        ProductVariant::query()->delete();

        $productsData = [
"""

for p in products:
    name_escaped = p['name'].replace("'", "\\'")
    short_desc_escaped = p['short_description'].replace("'", "\\'").replace("\n", "\\n")
    desc_escaped = p['description'].replace("'", "\\'").replace("\n", "\\n")
    sku_escaped = p['sku'].replace("'", "\\'")
    cat_slug_escaped = p['category_slug'].replace("'", "\\'")
    sale_price_val = f"{p['sale_price']:.2f}" if p['sale_price'] else "null"
    
    imgs_array_str = "[" + ", ".join([f"'{img}'" for img in p['images']]) + "]"
    all_cats_str = "[" + ", ".join([f"'{c}'" for c in p['all_categories']]) + "]"
    
    php_code += f"""            [
                'name' => '{name_escaped}',
                'slug' => '{p['slug']}',
                'sku' => '{sku_escaped}',
                'price' => {p['price']:.2f},
                'sale_price' => {sale_price_val},
                'short_description' => '{short_desc_escaped}',
                'description' => '{desc_escaped}',
                'category_slug' => '{cat_slug_escaped}',
                'all_categories' => {all_cats_str},
                'images' => {imgs_array_str},
                'is_featured' => {'true' if p['is_featured'] else 'false'},
                'is_new_arrival' => {'true' if p['is_new_arrival'] else 'false'},
                'is_best_seller' => {'true' if p['is_best_seller'] else 'false'},
            ],
"""

php_code += """        ];

        foreach ($productsData as $pData) {
            $product = Product::create([
                'ecommerce_id' => $ecommerce->id,
                'name' => $pData['name'],
                'slug' => $pData['slug'],
                'sku' => $pData['sku'],
                'description' => $pData['description'],
                'short_description' => mb_substr($pData['short_description'], 0, 240),
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
                'seo_description' => mb_substr($pData['short_description'], 0, 240),
            ]);

            // Attach categories
            foreach ($pData['all_categories'] as $cSlug) {
                if (isset($categories[$cSlug])) {
                    $product->categories()->syncWithoutDetaching([$categories[$cSlug]->id]);
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

            // Sample Reviews
            Review::create([
                'product_id' => $product->id,
                'customer_name' => 'Blessing O.',
                'rating' => 5,
                'comment' => 'Very effective product! My skin feels smooth and radiant.',
                'is_approved' => true,
            ]);
            Review::create([
                'product_id' => $product->id,
                'customer_name' => 'Grace A.',
                'rating' => 5,
                'comment' => 'Looking Good Is Our Pride indeed! 100% natural and high quality.',
                'is_approved' => true,
            ]);
        }
    }
}
"""

with open(seeder_path, 'w', encoding='utf-8') as out_f:
    out_f.write(php_code)

print("Updated DatabaseSeeder.php successfully!")
