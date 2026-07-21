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
        $admin = User::create([
            'name' => 'FairQueen Admin',
            'email' => 'admin@fairqueen.com',
            'password' => Hash::make('password'),
            'role_id' => $superAdminRoleId,
        ]);

        User::create([
            'name' => 'Sales Manager',
            'email' => 'sales@fairqueen.com',
            'password' => Hash::make('password'),
            'role_id' => $storeManagerRoleId,
        ]);


        // 2. Ecommerce
        $ecommerce = Ecommerce::firstOrCreate(
            ['slug' => 'fairqueen-collections'],
            [
                'name' => 'FairQueen Collections',
                'domain' => 'fairqueen.test',
                'status' => 'active',
            ]
        );


        // 3. Ecommerce Settings
        $settings = [
            'logo_url' => '/images/logo.png',
            'favicon_url' => '/favicon.ico',
            'theme_primary_color' => '#C5A880',
            'tagline' => 'Step Into Style',
            'description' => 'Shop elegant designer clothing, shoes, bags and accessories made for confident women who love standout fashion.',
            'instagram_url' => 'https://www.instagram.com/fairqueen_collections/',
            'instagram_handle' => '@fairqueen_collections',
            'facebook_url' => '',
            'tiktok_url' => '',
            'youtube_url' => '',
            'twitter_url' => '',
            'whatsapp_number' => '2348000000000',
            'store_address' => 'Plot 1234, Wuse II, Abuja, Nigeria',
            'opening_hours' => 'Monday-Saturday: 9:00 AM - 6:00 PM',
            'currency' => 'NGN',
            'delivery_coverage' => 'Abuja, Nationwide, Worldwide delivery',
            'bank_name' => 'Access Bank',
            'bank_account_number' => '1234567890',
            'bank_account_name' => 'FairQueen Collections Ltd',
            'return_policy' => 'We accept returns within 7 days of delivery for exchanges or store credit.',
            'privacy_policy' => 'We respect your privacy. We collect your name, phone number, email, and address to process your orders securely.',
            'terms_conditions' => 'By shopping with us, you agree to our terms. Payments must be verified before delivery.',
            'shipping_base_domestic' => '2000',
            'shipping_same_day_surcharge' => '5000',
            'shipping_international_base' => '25000',
            'shipping_free_threshold' => '100000',
            'shipping_item_multiplier' => '1500',
            'payment_gateway_active' => 'paystack',
            'stripe_key_public' => '',
            'stripe_key_secret' => '',
            'paypal_client_id' => '',
            'paypal_client_secret' => '',
            'paystack_key_public' => 'pk_test_mock123456789',
            'paystack_key_secret' => 'sk_test_mock123456789',
            'flutterwave_key_public' => 'flw_test_mock123456789',
            'flutterwave_key_secret' => 'flw_secret_mock123456789',
            'cod_enabled' => 'true',
            'announcement_show' => 'true',
            'announcement_text' => 'Free delivery on orders above N100,000! Use code WELCOME10 for 10% off your first order.',
            'promo_popup_show' => 'true',
            'promo_popup_title' => 'Join the FairQueen Family',
            'promo_popup_body' => '<p>Subscribe to our newsletter and get <strong>10% off</strong> your first order!</p>',
            'promo_popup_image' => '/images/popup-banner.jpg',
            'promo_popup_delay' => '5000',
            'show_gallery_page' => 'true',
            'show_blog_page' => 'true',
            'sold_count_enabled' => 'true',
            'sku_prefix' => 'FQ-',
            'sku_suffix' => '',
            'system_currency_code' => 'NGN',
            'system_currency_symbol' => 'N',
            'system_timezone' => 'Africa/Lagos',
        ];

        foreach ($settings as $key => $value) {
            EcommerceSetting::create([
                'ecommerce_id' => $ecommerce->id,
                'key' => $key,
                'value' => $value,
            ]);
        }

        // 4. Categories
        $categoriesData = [
            ['name' => 'Dresses', 'slug' => 'dresses', 'image_url' => '/images/categories/dresses.jpg'],
            ['name' => 'Jumpsuits', 'slug' => 'jumpsuits', 'image_url' => '/images/categories/jumpsuits.jpg'],
            ['name' => 'Shoes & Sneakers', 'slug' => 'shoes-sneakers', 'image_url' => '/images/categories/shoes.jpg'],
            ['name' => 'Handbags', 'slug' => 'handbags', 'image_url' => '/images/categories/bags.jpg'],
            ['name' => 'Accessories', 'slug' => 'accessories', 'image_url' => '/images/categories/accessories.jpg'],
            ['name' => 'Corporate Wear', 'slug' => 'corporate-wear', 'image_url' => '/images/categories/corporate.jpg'],
            ['name' => 'Evening Wear', 'slug' => 'evening-wear', 'image_url' => '/images/categories/evening.jpg'],
            ['name' => 'Casual Wear', 'slug' => 'casual-wear', 'image_url' => '/images/categories/casual.jpg'],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::create([
                'name' => $c['name'],
                'slug' => $c['slug'],
                'image_url' => $c['image_url'],
                'is_visible' => true,
            ]);
        }

        // 5. Collections
        $collectionsData = [
            ['name' => 'New Arrivals', 'slug' => 'new-arrivals', 'banner_url' => '/images/collections/new-arrivals.jpg'],
            ['name' => 'Weekend Looks', 'slug' => 'weekend-looks', 'banner_url' => '/images/collections/weekend.jpg'],
            ['name' => 'Best Sellers', 'slug' => 'best-sellers', 'banner_url' => '/images/collections/bestsellers.jpg'],
            ['name' => 'Summer Edit', 'slug' => 'summer-edit', 'banner_url' => '/images/collections/summer.jpg'],
        ];

        $collections = [];
        foreach ($collectionsData as $col) {
            $collections[$col['slug']] = Collection::create([
                'name' => $col['name'],
                'slug' => $col['slug'],
                'banner_url' => $col['banner_url'],
                'is_published' => true,
            ]);
        }

        // 6. Delivery Zones
        $deliveryZones = [
            ['name' => 'Abuja Delivery (Local)', 'shipping_fee' => 2000, 'estimated_days' => '1-2 Days'],
            ['name' => 'Nationwide Delivery (Nigeria)', 'shipping_fee' => 5000, 'estimated_days' => '3-5 Days'],
            ['name' => 'Worldwide Delivery', 'shipping_fee' => 25000, 'estimated_days' => '7-10 Days'],
            ['name' => 'Ecommerce Store Pickup (Abuja)', 'shipping_fee' => 0, 'estimated_days' => 'Ready same day'],
            ['name' => 'Lagos Express', 'shipping_fee' => 3500, 'estimated_days' => '1-2 Days'],
        ];

        foreach ($deliveryZones as $zone) {
            DeliveryZone::create($zone);
        }

        // 7. Shipping Rates
        $shippingRates = [
            ['name' => 'Standard Domestic', 'type' => 'flat', 'rate' => 2000, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
            ['name' => 'Express Same-Day Abuja', 'type' => 'flat', 'rate' => 5000, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
            ['name' => 'International DHL', 'type' => 'flat', 'rate' => 25000, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'international', 'shipping_countries' => ['US', 'UK', 'CA', 'AU']],
            ['name' => 'Free Shipping', 'type' => 'flat', 'rate' => 0, 'applicability' => 'all', 'is_active' => true, 'calculation_method' => 'flat', 'shipping_zone_type' => 'domestic'],
        ];

        foreach ($shippingRates as $rate) {
            ShippingRate::create($rate);
        }

        // 8. Taxes
        Tax::create(['name' => 'VAT (Nigeria)', 'rate' => 7.5, 'type' => 'exclusive', 'applicable_areas' => 'all', 'is_active' => true]);
        Tax::create(['name' => 'Luxury Goods Tax', 'rate' => 5.0, 'type' => 'exclusive', 'applicable_areas' => json_encode(['Abuja', 'Lagos']), 'is_active' => true]);

        // 9. Coupons
        $coupons = [
            ['code' => 'WELCOME10', 'type' => 'percentage', 'value' => 10, 'min_spend' => 20000, 'start_date' => now()->subDays(30), 'end_date' => now()->addDays(365), 'usage_limit' => 100, 'user_limit' => 1],
            ['code' => 'FLASH20', 'type' => 'percentage', 'value' => 20, 'min_spend' => 50000, 'start_date' => now()->subDays(5), 'end_date' => now()->addDays(10), 'usage_limit' => 50, 'user_limit' => 1],
            ['code' => 'FREEDELIVERY', 'type' => 'free_delivery', 'value' => 0, 'min_spend' => 80000, 'start_date' => now()->subDays(10), 'end_date' => now()->addDays(60), 'usage_limit' => 200, 'user_limit' => 3],
            ['code' => 'VIP5000', 'type' => 'fixed_amount', 'value' => 5000, 'min_spend' => 100000, 'start_date' => now()->subDays(20), 'end_date' => now()->addDays(90), 'usage_limit' => 30, 'user_limit' => 1],
        ];
        foreach ($coupons as $coupon) {
            Coupon::create($coupon);
        }

        // 10. Discounts
        $discounts = [
            ['name' => 'End of Season Sale', 'type' => 'percentage', 'value' => 30, 'min_qty_requirement' => 1, 'free_qty_reward' => 0, 'start_date' => now()->subDays(15), 'end_date' => now()->addDays(15), 'apply_to' => 'all', 'is_active' => true],
            ['name' => 'Buy 2 Get 1 Free', 'type' => 'bogo', 'value' => 0, 'min_qty_requirement' => 2, 'free_qty_reward' => 1, 'start_date' => now()->subDays(5), 'end_date' => now()->addDays(25), 'apply_to' => 'all', 'is_active' => true],
        ];
        foreach ($discounts as $discount) {
            Discount::create($discount);
        }

        // 11. Product Tags
        $productTags = [
            ['name' => 'Premium', 'label_text' => 'Premium Quality', 'icon' => 'crown', 'bg_color' => '#1a1a1a', 'text_color' => '#C5A880'],
            ['name' => 'Limited', 'label_text' => 'Limited Edition', 'icon' => 'star', 'bg_color' => '#C5A880', 'text_color' => '#1a1a1a'],
            ['name' => 'Eco', 'label_text' => 'Eco-Friendly', 'icon' => 'leaf', 'bg_color' => '#22c55e', 'text_color' => '#ffffff'],
            ['name' => 'Handmade', 'label_text' => 'Handcrafted', 'icon' => 'hand', 'bg_color' => '#8b5cf6', 'text_color' => '#ffffff'],
        ];
        $tags = [];
        foreach ($productTags as $tag) {
            $tags[$tag['name']] = ProductTag::create($tag);
        }

        // 12. Banners
        Banner::create(['title' => 'Step Into Style', 'subtitle' => 'Shop elegant designer clothing, shoes, bags and accessories made for confident women.', 'image_url' => '/images/hero-banner.jpg', 'link_url' => '/shop', 'type' => 'hero', 'is_active' => true]);
        Banner::create(['title' => 'New Season Drop', 'subtitle' => 'Explore premium looks and standout designer pieces.', 'image_url' => '/images/promo-banner.jpg', 'link_url' => '/shop/new-arrivals', 'type' => 'promo', 'is_active' => true]);
        Banner::create(['title' => 'Free Delivery Weekend', 'subtitle' => 'Enjoy complimentary shipping on all orders above N100,000 this weekend only.', 'image_url' => '/images/promo-banner-2.jpg', 'link_url' => '/shop', 'type' => 'promo', 'is_active' => true]);

        // 13. Pages
        $pages = [
            ['title' => 'About Us', 'slug' => 'about-us', 'content' => '<h1>About FairQueen Collections</h1><p>We are a premium ecommerce fashion brand based in Abuja, Nigeria, dedicated to bringing you the finest designer clothing, shoes, and handbags.</p>'],
            ['title' => 'Size Guide', 'slug' => 'size-guide', 'content' => '<h1>Size Guide</h1><p>Our sizing is standard UK size metrics for dresses and jumpsuits, and standard EU metrics for shoes and sneakers.</p>'],
            ['title' => 'FAQ', 'slug' => 'faq', 'content' => '<h1>Frequently Asked Questions</h1><p>How do you ship? We ship via local dispatch within Abuja and via trusted national couriers across Nigeria.</p>'],
            ['title' => 'Shipping & Delivery', 'slug' => 'shipping-delivery', 'content' => '<h1>Shipping & Delivery</h1><p>We offer multiple delivery options: Abuja Local (1-2 days), Nationwide (3-5 days), International (7-10 days).</p>'],
            ['title' => 'Privacy Policy', 'slug' => 'privacy-policy', 'content' => '<h1>Privacy Policy</h1><p>We respect your privacy. We collect your information to process orders securely.</p>'],
        ];
        foreach ($pages as $p) {
            Page::create($p);
        }

        // 14. Products
        $productsData = $this->getProductsData();
        $createdProducts = [];
        foreach ($productsData as $pData) {
            $cat = $categories[$pData['category_slug']];
            $totalStock = array_sum(array_column($pData['variants'], 'stock'));

            $product = Product::create([
                'ecommerce_id' => $ecommerce->id,
                'name' => $pData['name'],
                'slug' => $pData['slug'],
                'sku' => $pData['sku'],
                'description' => $pData['description'],
                'short_description' => $pData['short_description'],
                'price' => $pData['price'],
                'sale_price' => null,
                'cost_price' => $pData['cost_price'],
                'status' => 'published',
                'is_featured' => $pData['is_featured'],
                'is_new_arrival' => $pData['is_new_arrival'],
                'is_best_seller' => $pData['is_best_seller'],
                'has_variants' => $pData['has_variants'],
                'stock_quantity' => $totalStock,
                'low_stock_threshold' => 3,
                'seo_title' => $pData['name'] . ' | FairQueen Collections',
                'seo_description' => $pData['short_description'],
                'weight' => $pData['weight'] ?? null,
                'material' => $pData['material'] ?? null,
                'is_fragile' => $pData['is_fragile'] ?? false,
            ]);

            $createdProducts[] = $product;

            // Attach category via pivot table (many-to-many)
            $product->categories()->attach($cat->id);

            foreach ($pData['images'] as $idx => $img) {
                ProductImage::create(['product_id' => $product->id, 'image_url' => $img, 'color' => $pData['variants'][0]['color'] ?? null, 'sort_order' => $idx]);
            }

            foreach ($pData['variants'] as $v) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $product->sku . '-' . strtoupper(str_replace(' ', '', $v['size'])) . '-' . strtoupper(str_replace(' ', '', $v['color'])),
                    'size' => $v['size'],
                    'color' => $v['color'],
                    'price' => null,
                    'sale_price' => null,
                    'stock_quantity' => $v['stock'],
                    'low_stock_threshold' => 1,
                    'image_url' => $pData['images'][0],
                    'status' => 'active',
                ]);
            }

            if ($product->is_new_arrival) {
                $collections['new-arrivals']->products()->attach($product->id);
            }
            if ($product->is_featured) {
                $collections['weekend-looks']->products()->attach($product->id);
            }
            if ($product->is_best_seller) {
                $collections['best-sellers']->products()->attach($product->id);
            }

            if (!empty($pData['tag']) && isset($tags[$pData['tag']])) {
                $product->tags()->attach($tags[$pData['tag']]->id);
            }

            $reviewData = [
                ['name' => 'Chidi E.', 'rating' => 5, 'comment' => 'Outstanding quality and very fast delivery to Wuse II. Highly recommended!'],
                ['name' => 'Fatima A.', 'rating' => 4, 'comment' => 'True to size and fits perfectly. Excellent customer service over WhatsApp!'],
                ['name' => 'Ngozi O.', 'rating' => 5, 'comment' => 'The packaging was beautiful and the product exceeded my expectations.'],
                ['name' => 'Amina K.', 'rating' => 4, 'comment' => 'Lovely design but shipping took a day longer than expected.'],
                ['name' => 'Blessing M.', 'rating' => 5, 'comment' => 'This is my third order from FairQueen and they never disappoint.'],
            ];
            $numReviews = rand(2, 4);
            shuffle($reviewData);
            for ($i = 0; $i < $numReviews; $i++) {
                Review::create(['product_id' => $product->id, 'customer_name' => $reviewData[$i]['name'], 'rating' => $reviewData[$i]['rating'], 'comment' => $reviewData[$i]['comment'], 'is_approved' => true]);
            }
        }

        // 15. Blog Categories
        $blogCategories = [
            ['name' => 'Fashion Tips', 'slug' => 'fashion-tips'],
            ['name' => 'Style Guides', 'slug' => 'style-guides'],
            ['name' => 'Behind the Scenes', 'slug' => 'behind-the-scenes'],
            ['name' => 'Customer Stories', 'slug' => 'customer-stories'],
        ];
        $blogCats = [];
        foreach ($blogCategories as $bc) {
            $blogCats[$bc['slug']] = BlogCategory::create($bc);
        }

        // 16. Blog Tags
        $blogTags = [
            ['name' => 'Summer Style', 'slug' => 'summer-style'],
            ['name' => 'Corporate Wear', 'slug' => 'corporate-wear'],
            ['name' => 'Accessories', 'slug' => 'accessories'],
            ['name' => 'Sustainable Fashion', 'slug' => 'sustainable-fashion'],
            ['name' => 'Nigerian Fashion', 'slug' => 'nigerian-fashion'],
        ];
        $bTags = [];
        foreach ($blogTags as $bt) {
            $bTags[$bt['slug']] = BlogTag::create($bt);
        }

        // 17. Articles
        $articles = [
            ['title' => '10 Ways to Style Your Jumpsuit for Any Occasion', 'slug' => '10-ways-to-style-your-jumpsuit', 'content' => '<p>Jumpsuits are the ultimate versatile piece in any wardrobe...</p>', 'image_path' => '/images/blog/jumpsuit-style.jpg', 'status' => 'published', 'blog_category_id' => $blogCats['fashion-tips']->id, 'tags' => ['summer-style', 'corporate-wear']],
            ['title' => 'The Ultimate Guide to Nigerian Wedding Guest Fashion', 'slug' => 'nigerian-wedding-guest-fashion-guide', 'content' => '<p>Nigerian weddings are known for their vibrant celebrations...</p>', 'image_path' => '/images/blog/wedding-fashion.jpg', 'status' => 'published', 'blog_category_id' => $blogCats['style-guides']->id, 'tags' => ['nigerian-fashion', 'accessories']],
            ['title' => 'Behind the Seams: How FairQueen Sources Premium Fabrics', 'slug' => 'behind-the-seams-fairqueen-fabrics', 'content' => '<p>At FairQueen, we believe quality starts with the fabric...</p>', 'image_path' => '/images/blog/behind-seams.jpg', 'status' => 'published', 'blog_category_id' => $blogCats['behind-the-scenes']->id, 'tags' => ['sustainable-fashion', 'nigerian-fashion']],
            ['title' => 'Customer Spotlight: How Amanda Built Her Capsule Wardrobe', 'slug' => 'customer-spotlight-amanda-capsule-wardrobe', 'content' => '<p>Meet Amanda, a Lagos-based entrepreneur who transformed her wardrobe...</p>', 'image_path' => '/images/blog/customer-spotlight.jpg', 'status' => 'published', 'blog_category_id' => $blogCats['customer-stories']->id, 'tags' => ['corporate-wear', 'sustainable-fashion']],
            ['title' => 'Accessory Trends for 2026: What to Watch', 'slug' => 'accessory-trends-2026', 'content' => '<p>From oversized sunglasses to statement necklaces...</p>', 'image_path' => '/images/blog/accessory-trends.jpg', 'status' => 'published', 'blog_category_id' => $blogCats['fashion-tips']->id, 'tags' => ['accessories', 'sustainable-fashion']],
        ];

        foreach ($articles as $articleData) {
            $article = Article::create([
                'title' => $articleData['title'],
                'slug' => $articleData['slug'],
                'content' => $articleData['content'],
                'image_path' => $articleData['image_path'],
                'status' => $articleData['status'],
                'blog_category_id' => $articleData['blog_category_id'],
            ]);

            if (!empty($articleData['tags'])) {
                $tagIds = [];
                foreach ($articleData['tags'] as $tagSlug) {
                    if (isset($bTags[$tagSlug])) {
                        $tagIds[] = $bTags[$tagSlug]->id;
                    }
                }
                $article->tags()->attach($tagIds);
            }

            $comments = [
                ['name' => 'Jane D.', 'email' => 'jane@example.com', 'content' => 'This was so helpful! Love the styling tips.'],
                ['name' => 'Sarah K.', 'email' => 'sarah@example.com', 'content' => 'Great article! Can you do one on shoe styling next?'],
                ['name' => 'Peace O.', 'email' => 'peace@example.com', 'content' => 'FairQueen never disappoints with their content.'],
            ];
            foreach ($comments as $comment) {
                BlogComment::create(['article_id' => $article->id, 'name' => $comment['name'], 'email' => $comment['email'], 'content' => $comment['content'], 'is_approved' => true]);
            }
        }

        // 18. Gallery Items
        $galleryItems = [
            ['title' => 'New Arrivals Shoot 2026', 'image_path' => '/images/gallery/shoot-1.jpg', 'description' => 'Behind the scenes from our latest collection photoshoot.', 'is_visible' => true],
            ['title' => 'Abuja Fashion Week', 'image_path' => '/images/gallery/fashion-week.jpg', 'description' => 'FairQueen showcasing at Abuja Fashion Week 2026.', 'is_visible' => true],
            ['title' => 'Customer Appreciation Day', 'image_path' => '/images/gallery/customer-day.jpg', 'description' => 'Highlights from our annual customer appreciation event.', 'is_visible' => true],
            ['title' => 'Atelier Tour', 'image_path' => '/images/gallery/atelier.jpg', 'description' => 'A glimpse into our design studio and production process.', 'is_visible' => true],
            ['title' => 'Summer Collection Preview', 'image_path' => '/images/gallery/summer-preview.jpg', 'description' => 'Sneak peek of our upcoming summer collection.', 'is_visible' => true],
        ];
        foreach ($galleryItems as $gi) {
            GalleryItem::create($gi);
        }

        // 19. Customers with Addresses & Orders
        $customersData = [
            ['name' => 'Amanda Chukwu', 'email' => 'amanda@example.com', 'phone' => '2348012345678', 'password' => 'password', 'measurements' => ['bust' => '36', 'waist' => '29', 'hips' => '39', 'height' => '5\'7"'], 'addresses' => [['address_line_1' => '12 Banana Island Road', 'city' => 'Lagos', 'state' => 'Lagos', 'country' => 'Nigeria', 'is_default' => true]]],
            ['name' => 'Ngozi Okonkwo', 'email' => 'ngozi@example.com', 'phone' => '2348023456789', 'password' => 'password', 'measurements' => ['bust' => '38', 'waist' => '31', 'hips' => '41', 'height' => '5\'6"'], 'addresses' => [['address_line_1' => '45 Wuse Zone 4', 'city' => 'Abuja', 'state' => 'FCT', 'country' => 'Nigeria', 'is_default' => true], ['address_line_1' => '78 Garki Area 10', 'city' => 'Abuja', 'state' => 'FCT', 'country' => 'Nigeria', 'is_default' => false]]],
            ['name' => 'Fatima Abdullahi', 'email' => 'fatima@example.com', 'phone' => '2348034567890', 'password' => 'password', 'measurements' => ['bust' => '34', 'waist' => '27', 'hips' => '37', 'height' => '5\'5"'], 'addresses' => [['address_line_1' => '23 Kano Road', 'city' => 'Kano', 'state' => 'Kano', 'country' => 'Nigeria', 'is_default' => true]]],
            ['name' => 'Blessing Eze', 'email' => 'blessing@example.com', 'phone' => '2348045678901', 'password' => 'password', 'measurements' => ['bust' => '40', 'waist' => '33', 'hips' => '43', 'height' => '5\'8"'], 'addresses' => [['address_line_1' => '67 Port Harcourt Road', 'city' => 'Port Harcourt', 'state' => 'Rivers', 'country' => 'Nigeria', 'is_default' => true]]],
            ['name' => 'Chidi Nwosu', 'email' => 'chidi@example.com', 'phone' => '2348056789012', 'password' => 'password', 'measurements' => ['bust' => '36', 'waist' => '30', 'hips' => '40', 'height' => '5\'6"'], 'addresses' => [['address_line_1' => '89 Enugu Street', 'city' => 'Enugu', 'state' => 'Enugu', 'country' => 'Nigeria', 'is_default' => true]]],
        ];

        $createdCustomers = [];
        foreach ($customersData as $cData) {
            $customer = Customer::create([
                'name' => $cData['name'],
                'email' => $cData['email'],
                'phone' => $cData['phone'],
                'password' => Hash::make($cData['password']),
                'measurements' => $cData['measurements'],
            ]);

            foreach ($cData['addresses'] as $addr) {
                CustomerAddress::create(array_merge(['customer_id' => $customer->id], $addr));
            }

            $createdCustomers[] = $customer;
        }

        // 20. Orders with Order Items and Payments
        $orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        $paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        $paymentMethods = ['paystack', 'bank_transfer', 'cod', 'flutterwave'];

        $orderData = [
            ['customer_idx' => 0, 'status' => 'delivered', 'payment_status' => 'paid', 'payment_method' => 'paystack', 'items' => [['product_idx' => 0, 'variant_idx' => 0, 'qty' => 1], ['product_idx' => 3, 'variant_idx' => 0, 'qty' => 1]]],
            ['customer_idx' => 1, 'status' => 'shipped', 'payment_status' => 'paid', 'payment_method' => 'bank_transfer', 'items' => [['product_idx' => 6, 'variant_idx' => 1, 'qty' => 1], ['product_idx' => 8, 'variant_idx' => 1, 'qty' => 2]]],
            ['customer_idx' => 2, 'status' => 'processing', 'payment_status' => 'paid', 'payment_method' => 'paystack', 'items' => [['product_idx' => 1, 'variant_idx' => 0, 'qty' => 1]]],
            ['customer_idx' => 3, 'status' => 'pending', 'payment_status' => 'pending', 'payment_method' => 'cod', 'items' => [['product_idx' => 4, 'variant_idx' => 2, 'qty' => 1], ['product_idx' => 9, 'variant_idx' => 0, 'qty' => 1]]],
            ['customer_idx' => 4, 'status' => 'delivered', 'payment_status' => 'paid', 'payment_method' => 'flutterwave', 'items' => [['product_idx' => 5, 'variant_idx' => 1, 'qty' => 1], ['product_idx' => 7, 'variant_idx' => 2, 'qty' => 1]]],
            ['customer_idx' => 0, 'status' => 'cancelled', 'payment_status' => 'failed', 'payment_method' => 'paystack', 'items' => [['product_idx' => 2, 'variant_idx' => 1, 'qty' => 1]]],
            ['customer_idx' => 1, 'status' => 'delivered', 'payment_status' => 'paid', 'payment_method' => 'bank_transfer', 'items' => [['product_idx' => 10, 'variant_idx' => 0, 'qty' => 1], ['product_idx' => 11, 'variant_idx' => 0, 'qty' => 1]]],
            ['customer_idx' => 2, 'status' => 'shipped', 'payment_status' => 'paid', 'payment_method' => 'paystack', 'items' => [['product_idx' => 12, 'variant_idx' => 0, 'qty' => 2], ['product_idx' => 13, 'variant_idx' => 1, 'qty' => 1]]],
            ['customer_idx' => 3, 'status' => 'delivered', 'payment_status' => 'paid', 'payment_method' => 'cod', 'items' => [['product_idx' => 14, 'variant_idx' => 0, 'qty' => 1]]],
            ['customer_idx' => 4, 'status' => 'processing', 'payment_status' => 'pending', 'payment_method' => 'paystack', 'items' => [['product_idx' => 0, 'variant_idx' => 1, 'qty' => 1], ['product_idx' => 6, 'variant_idx' => 0, 'qty' => 1]]],
        ];

        foreach ($orderData as $idx => $oData) {
            $customer = $createdCustomers[$oData['customer_idx']];
            $defaultAddress = $customer->addresses()->where('is_default', true)->first();

            $subtotal = 0;
            $orderItems = [];

            foreach ($oData['items'] as $item) {
                $product = $createdProducts[$item['product_idx']];
                $variant = $product->variants[$item['variant_idx']] ?? null;
                $price = $variant ? ($variant->price ?? $product->price) : $product->price;
                $lineTotal = $price * $item['qty'];
                $subtotal += $lineTotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'product_name' => $product->name,
                    'variant_label' => $variant ? $variant->size . ' / ' . $variant->color : 'One Size',
                    'price' => $price,
                    'quantity' => $item['qty'],
                ];
            }

            $deliveryFee = $subtotal >= 100000 ? 0 : 2000;
            $discountAmount = 0;
            $taxAmount = round($subtotal * 0.075, 2);
            $total = $subtotal + $deliveryFee - $discountAmount + $taxAmount;

            $order = Order::create([
                'ecommerce_id' => $ecommerce->id,
                'customer_id' => $customer->id,
                'order_number' => 'FQ-' . strtoupper(Str::random(8)),
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => $customer->phone,
                'delivery_address' => $defaultAddress?->address_line_1 ?? 'N/A',
                'delivery_city' => $defaultAddress?->city ?? 'N/A',
                'delivery_state' => $defaultAddress?->state ?? 'N/A',
                'delivery_country' => $defaultAddress?->country ?? 'Nigeria',
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'delivery_fee' => $deliveryFee,
                'total_amount' => $total,
                'payment_method' => $oData['payment_method'],
                'payment_status' => $oData['payment_status'],
                'order_status' => $oData['status'],
                'delivery_method' => 'standard',
                'notes' => $idx % 3 === 0 ? 'Please gift wrap this order.' : null,
                'paid_at' => in_array($oData['payment_status'], ['paid', 'refunded']) ? now()->subDays(rand(1, 10)) : null,
                'delivered_at' => $oData['status'] === 'delivered' ? now()->subDays(rand(1, 5)) : null,
                'tax_amount' => $taxAmount,
                'tax_details' => ['VAT' => $taxAmount],
            ]);

            foreach ($orderItems as $oi) {
                OrderItem::create(array_merge(['order_id' => $order->id], $oi));
            }

            if (in_array($oData['payment_status'], ['paid', 'refunded'])) {
                Payment::create([
                    'order_id' => $order->id,
                    'transaction_reference' => 'TRX-' . strtoupper(Str::random(12)),
                    'gateway' => $oData['payment_method'],
                    'amount' => $total,
                    'status' => $oData['payment_status'],
                    'gateway_response' => ['status' => 'success', 'message' => 'Payment processed successfully'],
                ]);
            }
        }

        // 21. Inventory Logs
        foreach ($createdProducts as $product) {
            foreach ($product->variants as $variant) {
                if (rand(0, 1) === 1) {
                    InventoryLog::create([
                        'product_variant_id' => $variant->id,
                        'product_id' => $product->id,
                        'old_quantity' => $variant->stock_quantity + rand(1, 5),
                        'new_quantity' => $variant->stock_quantity,
                        'change_amount' => -rand(1, 5),
                        'reason' => 'Order fulfillment',
                        'user_id' => $admin->id,
                    ]);
                }
            }
        }

        // 22. Contact Inquiries
        $inquiries = [
            ['name' => 'Jennifer A.', 'email' => 'jennifer@example.com', 'subject' => 'Wholesale Inquiry', 'message' => 'I am interested in purchasing your products in bulk for my ecommerce in Ibadan. Do you offer wholesale pricing?', 'is_read' => true],
            ['name' => 'Michael O.', 'email' => 'michael@example.com', 'subject' => 'Custom Order', 'message' => 'Can you create a custom dress for my wife for our anniversary? I would like it in royal blue.', 'is_read' => false],
            ['name' => 'Sarah K.', 'email' => 'sarah@example.com', 'subject' => 'Return Request', 'message' => 'I received my order yesterday but the size is too small. How do I initiate a return?', 'is_read' => true],
            ['name' => 'David M.', 'email' => 'david@example.com', 'subject' => 'Partnership', 'message' => 'I run a fashion blog with 50k followers. Would you be interested in a collaboration?', 'is_read' => false],
            ['name' => 'Grace L.', 'email' => 'grace@example.com', 'subject' => 'Product Availability', 'message' => 'When will the Emerald Green Velvet Evening Gown be back in stock? I need it for an event next month.', 'is_read' => true],
        ];
        foreach ($inquiries as $inquiry) {
            ContactInquiry::create($inquiry);
        }

        $this->call(FaqSeeder::class);

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function getProductsData(): array
    {
        return [
            [
                'category_slug' => 'jumpsuits',
                'name' => 'Luxury Black Wide-Leg Jumpsuit',
                'slug' => 'luxury-black-wide-leg-jumpsuit',
                'sku' => 'FQ-JMP-BLK',
                'description' => 'Exquisite black jumpsuit with a modern wide-leg profile and gold hardware accents. Ideal for corporate dinners, cocktail parties, and luxury weekend outings.',
                'short_description' => 'Elegant wide-leg jumpsuit with gold buckle belt.',
                'price' => 45000.00, 'cost_price' => 22500.00,
                'is_featured' => true, 'is_new_arrival' => true, 'is_best_seller' => false,
                'has_variants' => true, 'weight' => 0.8, 'material' => 'Polyester Blend', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 14', 'color' => 'Black', 'stock' => 5],
                    ['size' => 'UK 16', 'color' => 'Black', 'stock' => 3],
                    ['size' => 'UK 18', 'color' => 'Black', 'stock' => 2],
                ],
                'images' => ['/images/products/jumpsuit-black-1.jpg', '/images/products/jumpsuit-black-2.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'jumpsuits',
                'name' => 'Champagne Satin Wrap Jumpsuit',
                'slug' => 'champagne-satin-wrap-jumpsuit',
                'sku' => 'FQ-JMP-CHM',
                'description' => 'Glossy champagne-nude wrap jumpsuit made from premium satin. Features a flattering cinched waist and pleated detail.',
                'short_description' => 'Premium wrap satin jumpsuit in champagne.',
                'price' => 55000.00, 'cost_price' => 27500.00,
                'is_featured' => true, 'is_new_arrival' => false, 'is_best_seller' => true,
                'has_variants' => true, 'weight' => 0.7, 'material' => 'Premium Satin', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 12', 'color' => 'Champagne', 'stock' => 3],
                    ['size' => 'UK 14', 'color' => 'Champagne', 'stock' => 4],
                    ['size' => 'UK 16', 'color' => 'Champagne', 'stock' => 2],
                ],
                'images' => ['/images/products/jumpsuit-champagne-1.jpg'],
                'tag' => 'Limited',
            ],
            [
                'category_slug' => 'shoes-sneakers',
                'name' => 'White Platform Designer Sneakers',
                'slug' => 'white-platform-designer-sneakers',
                'sku' => 'FQ-SNK-WHT',
                'description' => 'Standout chunky platform white sneakers with custom gold lettering details. Made of premium full-grain leather.',
                'short_description' => 'Premium leather white platform sneakers.',
                'price' => 35000.00, 'cost_price' => 17500.00,
                'is_featured' => false, 'is_new_arrival' => true, 'is_best_seller' => true,
                'has_variants' => true, 'weight' => 1.2, 'material' => 'Full-Grain Leather', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'EU 38', 'color' => 'White', 'stock' => 5],
                    ['size' => 'EU 39', 'color' => 'White', 'stock' => 8],
                    ['size' => 'EU 40', 'color' => 'White', 'stock' => 6],
                    ['size' => 'EU 41', 'color' => 'White', 'stock' => 3],
                ],
                'images' => ['/images/products/sneakers-white-1.jpg', '/images/products/sneakers-white-2.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'handbags',
                'name' => 'FairQueen Signature Leather Bag',
                'slug' => 'fairqueen-signature-leather-bag',
                'sku' => 'FQ-BAG-SGN',
                'description' => 'A timeless luxury handbag crafted from genuine embossed leather. Features double structured handles and gold padlock hardware.',
                'short_description' => 'Structured luxury handbag with gold detailing.',
                'price' => 85000.00, 'cost_price' => 42500.00,
                'is_featured' => true, 'is_new_arrival' => true, 'is_best_seller' => true,
                'has_variants' => false, 'weight' => 1.5, 'material' => 'Genuine Embossed Leather', 'is_fragile' => false,
                'variants' => [['size' => 'One Size', 'color' => 'Nude Gold', 'stock' => 5]],
                'images' => ['/images/products/bag-nude-1.jpg', '/images/products/bag-nude-2.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'corporate-wear',
                'name' => 'Navy Blue Double-Breasted Suit Set',
                'slug' => 'navy-blue-double-breasted-suit-set',
                'sku' => 'FQ-SUT-NVY',
                'description' => 'Fitted corporate double-breasted suit jacket paired with matching straight-leg trousers. Premium polyester blend.',
                'short_description' => 'Double-breasted blazer and trousers suit set.',
                'price' => 65000.00, 'cost_price' => 32500.00,
                'is_featured' => false, 'is_new_arrival' => true, 'is_best_seller' => false,
                'has_variants' => true, 'weight' => 1.0, 'material' => 'Premium Polyester Blend', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 12', 'color' => 'Navy Blue', 'stock' => 2],
                    ['size' => 'UK 14', 'color' => 'Navy Blue', 'stock' => 4],
                    ['size' => 'UK 16', 'color' => 'Navy Blue', 'stock' => 3],
                ],
                'images' => ['/images/products/suit-navy-1.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'dresses',
                'name' => 'Blush Pink Pleated Midi Dress',
                'slug' => 'blush-pink-pleated-midi-dress',
                'sku' => 'FQ-DRS-PNK',
                'description' => 'Elegant midi dress featuring a pleated skirt, cinched waist, and self-tie bow neck detail. Perfect for wedding guests.',
                'short_description' => 'Charming blush pleated midi dress.',
                'price' => 42000.00, 'cost_price' => 21000.00,
                'is_featured' => true, 'is_new_arrival' => false, 'is_best_seller' => false,
                'has_variants' => true, 'weight' => 0.6, 'material' => 'Chiffon', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 10', 'color' => 'Blush Pink', 'stock' => 4],
                    ['size' => 'UK 12', 'color' => 'Blush Pink', 'stock' => 5],
                    ['size' => 'UK 14', 'color' => 'Blush Pink', 'stock' => 2],
                ],
                'images' => ['/images/products/dress-blush-1.jpg'],
                'tag' => 'Limited',
            ],
            [
                'category_slug' => 'dresses',
                'name' => 'Emerald Green Velvet Evening Gown',
                'slug' => 'emerald-green-velvet-evening-gown',
                'sku' => 'FQ-DRS-EMV',
                'description' => 'Stunning floor-length velvet gown in rich emerald green. Features deep V-neckline and flowing A-line skirt.',
                'short_description' => 'Luxurious emerald velvet evening gown.',
                'price' => 78000.00, 'cost_price' => 39000.00,
                'is_featured' => true, 'is_new_arrival' => true, 'is_best_seller' => true,
                'has_variants' => true, 'weight' => 1.3, 'material' => 'Premium Velvet', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 10', 'color' => 'Emerald Green', 'stock' => 3],
                    ['size' => 'UK 12', 'color' => 'Emerald Green', 'stock' => 4],
                    ['size' => 'UK 14', 'color' => 'Emerald Green', 'stock' => 2],
                    ['size' => 'UK 16', 'color' => 'Emerald Green', 'stock' => 3],
                ],
                'images' => ['/images/products/dress-emerald-1.jpg', '/images/products/dress-emerald-2.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'shoes-sneakers',
                'name' => 'Rose Gold Strappy Heels',
                'slug' => 'rose-gold-strappy-heels',
                'sku' => 'FQ-SHS-RGD',
                'description' => 'Elegant rose gold strappy stiletto heels with adjustable ankle straps. Perfect for evening wear.',
                'short_description' => 'Rose gold strappy stiletto heels.',
                'price' => 28000.00, 'cost_price' => 14000.00,
                'is_featured' => false, 'is_new_arrival' => true, 'is_best_seller' => false,
                'has_variants' => true, 'weight' => 0.9, 'material' => 'Synthetic Leather', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'EU 38', 'color' => 'Rose Gold', 'stock' => 4],
                    ['size' => 'EU 39', 'color' => 'Rose Gold', 'stock' => 6],
                    ['size' => 'EU 40', 'color' => 'Rose Gold', 'stock' => 3],
                    ['size' => 'EU 41', 'color' => 'Rose Gold', 'stock' => 2],
                ],
                'images' => ['/images/products/heels-rose-1.jpg'],
                'tag' => 'Limited',
            ],
            [
                'category_slug' => 'handbags',
                'name' => 'Mini Quilted Crossbody Bag',
                'slug' => 'mini-quilted-crossbody-bag',
                'sku' => 'FQ-BAG-QCB',
                'description' => 'Chic mini quilted crossbody bag with gold chain strap and turn-lock closure.',
                'short_description' => 'Quilted crossbody with chain strap.',
                'price' => 32000.00, 'cost_price' => 16000.00,
                'is_featured' => false, 'is_new_arrival' => false, 'is_best_seller' => true,
                'has_variants' => true, 'weight' => 0.5, 'material' => 'Quilted Faux Leather', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'One Size', 'color' => 'Black', 'stock' => 8],
                    ['size' => 'One Size', 'color' => 'Beige', 'stock' => 5],
                    ['size' => 'One Size', 'color' => 'Red', 'stock' => 3],
                ],
                'images' => ['/images/products/bag-quilted-1.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'accessories',
                'name' => 'Gold Plated Statement Necklace',
                'slug' => 'gold-plated-statement-necklace',
                'sku' => 'FQ-ACC-NCK',
                'description' => 'Bold gold-plated statement necklace with geometric pendant design. Hypoallergenic finish.',
                'short_description' => 'Bold geometric statement necklace.',
                'price' => 15000.00, 'cost_price' => 7500.00,
                'is_featured' => true, 'is_new_arrival' => false, 'is_best_seller' => false,
                'has_variants' => false, 'weight' => 0.2, 'material' => 'Gold-Plated Alloy', 'is_fragile' => true,
                'variants' => [['size' => 'One Size', 'color' => 'Gold', 'stock' => 12]],
                'images' => ['/images/products/necklace-gold-1.jpg'],
                'tag' => 'Handmade',
            ],
            [
                'category_slug' => 'corporate-wear',
                'name' => 'Cream Silk Blouse & Trousers Set',
                'slug' => 'cream-silk-blouse-trousers-set',
                'sku' => 'FQ-CRP-CRM',
                'description' => 'Sophisticated cream silk blouse with high-waisted wide-leg trousers. Modern corporate elegance.',
                'short_description' => 'Elegant silk blouse and trousers set.',
                'price' => 58000.00, 'cost_price' => 29000.00,
                'is_featured' => true, 'is_new_arrival' => true, 'is_best_seller' => false,
                'has_variants' => true, 'weight' => 0.9, 'material' => 'Pure Silk', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 10', 'color' => 'Cream', 'stock' => 3],
                    ['size' => 'UK 12', 'color' => 'Cream', 'stock' => 4],
                    ['size' => 'UK 14', 'color' => 'Cream', 'stock' => 2],
                    ['size' => 'UK 16', 'color' => 'Cream', 'stock' => 3],
                ],
                'images' => ['/images/products/corporate-cream-1.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'dresses',
                'name' => 'African Print Ankara Maxi Dress',
                'slug' => 'african-print-ankara-maxi-dress',
                'sku' => 'FQ-DRS-ANK',
                'description' => 'Vibrant African print Ankara maxi dress with off-shoulder design and ruffled hem.',
                'short_description' => 'Vibrant Ankara print maxi dress.',
                'price' => 38000.00, 'cost_price' => 19000.00,
                'is_featured' => false, 'is_new_arrival' => true, 'is_best_seller' => true,
                'has_variants' => true, 'weight' => 0.7, 'material' => '100% Cotton Ankara', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'UK 12', 'color' => 'Multi-Print', 'stock' => 5],
                    ['size' => 'UK 14', 'color' => 'Multi-Print', 'stock' => 4],
                    ['size' => 'UK 16', 'color' => 'Multi-Print', 'stock' => 3],
                ],
                'images' => ['/images/products/dress-ankara-1.jpg'],
                'tag' => 'Handmade',
            ],
            [
                'category_slug' => 'accessories',
                'name' => 'Oversized Cat-Eye Sunglasses',
                'slug' => 'oversized-cat-eye-sunglasses',
                'sku' => 'FQ-ACC-SUN',
                'description' => 'Trendy oversized cat-eye sunglasses with UV400 protection and gold metal detailing.',
                'short_description' => 'Oversized cat-eye sunglasses with UV protection.',
                'price' => 12000.00, 'cost_price' => 6000.00,
                'is_featured' => false, 'is_new_arrival' => true, 'is_best_seller' => false,
                'has_variants' => true, 'weight' => 0.3, 'material' => 'Acetate & Metal', 'is_fragile' => true,
                'variants' => [
                    ['size' => 'One Size', 'color' => 'Black', 'stock' => 10],
                    ['size' => 'One Size', 'color' => 'Tortoise', 'stock' => 6],
                ],
                'images' => ['/images/products/sunglasses-1.jpg'],
                'tag' => 'Limited',
            ],
            [
                'category_slug' => 'shoes-sneakers',
                'name' => 'Black Patent Leather Pumps',
                'slug' => 'black-patent-leather-pumps',
                'sku' => 'FQ-SHS-BPP',
                'description' => 'Classic black patent leather pointed-toe pumps with 3-inch heel. A wardrobe essential.',
                'short_description' => 'Classic pointed-toe patent leather pumps.',
                'price' => 25000.00, 'cost_price' => 12500.00,
                'is_featured' => false, 'is_new_arrival' => false, 'is_best_seller' => true,
                'has_variants' => true, 'weight' => 0.8, 'material' => 'Patent Leather', 'is_fragile' => false,
                'variants' => [
                    ['size' => 'EU 38', 'color' => 'Black', 'stock' => 5],
                    ['size' => 'EU 39', 'color' => 'Black', 'stock' => 7],
                    ['size' => 'EU 40', 'color' => 'Black', 'stock' => 4],
                    ['size' => 'EU 41', 'color' => 'Black', 'stock' => 3],
                ],
                'images' => ['/images/products/pumps-black-1.jpg'],
                'tag' => 'Premium',
            ],
            [
                'category_slug' => 'handbags',
                'name' => 'Woven Raffia Tote Bag',
                'slug' => 'woven-raffia-tote-bag',
                'sku' => 'FQ-BAG-RAF',
                'description' => 'Handwoven raffia tote bag with leather handles and cotton lining. Perfect for beach days.',
                'short_description' => 'Handwoven raffia tote with leather handles.',
                'price' => 22000.00, 'cost_price' => 11000.00,
                'is_featured' => true, 'is_new_arrival' => true, 'is_best_seller' => false,
                'has_variants' => false, 'weight' => 0.6, 'material' => 'Natural Raffia & Leather', 'is_fragile' => false,
                'variants' => [['size' => 'One Size', 'color' => 'Natural', 'stock' => 7]],
                'images' => ['/images/products/bag-raffia-1.jpg'],
                'tag' => 'Eco',
            ],
        ];
    }
}
