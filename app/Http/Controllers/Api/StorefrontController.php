<?php

namespace App\Http\Controllers\Api;

use Illuminate\Validation\Rule;

use App\Mail\StoreMessage;
use App\Services\StoreMailer;

use App\Http\Controllers\Controller;
use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\DeliveryZone;
use App\Models\Banner;
use App\Models\Page;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\InventoryLog;
use App\Models\Review;
use App\Models\Coupon;
use App\Models\Article;
use App\Models\GalleryItem;
use App\Models\Discount;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Tax;
use App\Models\ShippingRate;
use App\Models\ProductTag;
use App\Mail\OrderInvoiceMail;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class StorefrontController extends Controller
{
    /**
     * Get Ecommerce configuration and settings.
     */
    public function getSettings()
    {
        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json([
                'success' => false,
                'message' => 'No ecommerce found',
            ], 404);
        }

        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        // This endpoint is public. Never expose server-side credentials: gateway
        // secrets, API tokens or the maintenance bypass key.
        foreach (array_keys($settings) as $key) {
            if (preg_match('/(secret|access_token|private_key|bypass_key)/i', $key)) {
                unset($settings[$key]);
            }
        }

        // Auto-expire flash sale campaign if countdown end time has passed
        if (!empty($settings['flash_sale_end_time'])) {
            $flashEndTime = strtotime($settings['flash_sale_end_time']);
            if ($flashEndTime && $flashEndTime <= time()) {
                $settings['flash_sale_show'] = 'false';
                $settings['flash_sale_is_ended'] = 'true';
            }
        }

        // Provide a random product image as dynamic fallback if auth_image_url is not customized
        $randomProductImage = null;
        if (empty($settings['auth_image_url'])) {
            $randomImgRecord = \App\Models\ProductImage::whereNotNull('image_url')
                ->where('image_url', '!=', '')
                ->inRandomOrder()
                ->first();
            if ($randomImgRecord) {
                $randomProductImage = $randomImgRecord->image_url;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'ecommerce' => $ecommerce,
                'settings' => $settings,
                'fallback_auth_image_url' => $randomProductImage,
            ]
        ]);
    }

    /**
     * Return a small cached Instagram Professional account feed.
     * Credentials remain server-side and failures degrade to an empty feed.
     */
    public function getInstagramFeed()
    {
        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $settings = EcommerceSetting::where('ecommerce_id', $ecommerce->id)
            ->whereIn('key', ['instagram_access_token', 'instagram_url'])
            ->pluck('value', 'key');
        $token = trim((string) ($settings['instagram_access_token'] ?? ''));

        if ($token === '') {
            return response()->json([
                'success' => true,
                'data' => [],
                'profile_url' => $settings['instagram_url'] ?? null,
                'source' => 'fallback',
            ]);
        }

        $items = Cache::remember('storefront.instagram.feed', now()->addMinutes(30), function () use ($token) {
            try {
                $response = Http::timeout(6)->retry(1, 250)->get('https://graph.instagram.com/v25.0/me/media', [
                    'fields' => 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp',
                    'limit' => 8,
                    'access_token' => $token,
                ]);

                if (!$response->successful()) {
                    Log::warning('Instagram feed request failed', ['status' => $response->status()]);
                    return [];
                }

                return collect($response->json('data', []))
                    ->filter(fn ($item) => !empty($item['media_url']) || !empty($item['thumbnail_url']))
                    ->take(8)
                    ->values()
                    ->all();
            } catch (\Throwable $exception) {
                Log::warning('Instagram feed unavailable', ['message' => $exception->getMessage()]);
                return [];
            }
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'profile_url' => $settings['instagram_url'] ?? null,
            'source' => count($items) > 0 ? 'instagram' : 'fallback',
        ]);
    }

    /**
     * Get active homepage banners.
     */
    public function getBanners()
    {
        $banners = Banner::where('is_active', true)
            ->where('type', 'hero')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
        return response()->json([
            'success' => true,
            'data' => $banners
        ]);
    }

    /**
     * Get visible categories.
     */
    public function getCategories()
    {
        $categories = Category::where('is_visible', true)
            ->whereNull('parent_id')
            ->withCount('products')
            ->with(['children' => function($q) {
                $q->where('is_visible', true)->withCount('products');
            }])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Get active collections with product counts.
     */
    public function getCollections()
    {
        $collections = Collection::where('is_published', true)->with('categories')->get();

        // A few product thumbnails per category so the mega menu can show one beside each name.
        $categoryIds = $collections->pluck('categories')->flatten()->pluck('id')->unique()->values();
        if ($categoryIds->isNotEmpty()) {
            $thumbnails = Cache::remember(
                'storefront.category.thumbnails.' . md5($categoryIds->join(',')),
                now()->addMinutes(30),
                function () use ($categoryIds) {
                    return Product::where('status', 'published')
                        ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $categoryIds))
                        ->with(['images' => fn ($q) => $q->orderBy('id'), 'categories:id'])
                        ->latest('id')
                        ->take(300)
                        ->get()
                        ->flatMap(function ($product) {
                            $image = $product->images->first()?->image_url;
                            return $image
                                ? $product->categories->map(fn ($c) => ['category_id' => $c->id, 'image' => $image])
                                : [];
                        })
                        ->groupBy('category_id')
                        ->map(fn ($rows) => $rows->pluck('image')->unique()->take(6)->values()->all());
                }
            );

            $collections->each(function ($collection) use ($thumbnails) {
                $collection->categories->each(function ($category) use ($thumbnails) {
                    $category->sample_images = $thumbnails[$category->id] ?? [];
                });
            });
        }

        return response()->json([
            'success' => true,
            'data' => $collections
        ]);
    }

    /**
     * Get active delivery zones.
     */
    public function getDeliveryZones()
    {
        $zones = DeliveryZone::all();
        return response()->json([
            'success' => true,
            'data' => $zones
        ]);
    }

    /**
     * Get active advanced shipping rates.
     */
    public function getShippingRates()
    {
        // Everything the storefront needs to show the same options checkout will accept.
        $rates = app(\App\Services\ShippingCalculator::class)->storefrontData();
        return response()->json([
            'success' => true,
            'data' => $rates
        ]);
    }

    /**
     * Admin-defined concern cards, normalised. Each card maps to real categories,
     * collections or hand-picked products.
     */
    private function shopConcernItems(): array
    {
        $raw = EcommerceSetting::where('ecommerce_id', Ecommerce::query()->value('id'))
            ->where('key', 'shop_by_concern_items')->value('value');
        $items = is_string($raw) ? json_decode($raw, true) : $raw;

        return collect(is_array($items) ? $items : [])
            ->filter(fn ($item) => !empty($item['name']))
            ->map(function ($item) {
                $values = $item['filter_values'] ?? [];
                return [
                    'slug' => $item['slug'] ?? Str::slug($item['name']),
                    'name' => $item['name'],
                    'blurb' => $item['blurb'] ?? '',
                    'image' => $item['image'] ?? '',
                    'filter_type' => in_array($item['filter_type'] ?? '', ['category', 'collection', 'products'], true) ? $item['filter_type'] : 'category',
                    'filter_values' => array_values(array_filter(is_array($values) ? $values : explode(',', (string) $values))),
                ];
            })
            ->values()
            ->all();
    }

    private function applyConcernFilter($query, array $concern): void
    {
        $values = $concern['filter_values'];
        if (!$values) {
            $query->whereRaw('1 = 0');
            return;
        }

        match ($concern['filter_type']) {
            'collection' => $query->whereHas('collections', fn ($q) => $q->whereIn('collections.slug', $values)),
            'products' => $query->whereIn('products.id', $values),
            default => $query->whereHas('categories', fn ($q) => $q->whereIn('categories.slug', $values)),
        };
    }

    /**
     * Homepage "Shop by concern" section with live product counts.
     */
    public function getShopConcerns()
    {
        $settings = EcommerceSetting::where('ecommerce_id', Ecommerce::query()->value('id'))
            ->whereIn('key', ['shop_by_concern_show', 'shop_by_concern_eyebrow', 'shop_by_concern_title'])
            ->pluck('value', 'key');

        $items = collect($this->shopConcernItems())->map(function ($concern) {
            $query = Product::where('status', 'published');
            $this->applyConcernFilter($query, $concern);
            $count = (clone $query)->count();
            $previews = $query->with('images')->latest()->take(3)->get()
                ->map(fn ($p) => $p->images->first()?->image_url)
                ->filter()->values()->all();

            return [
                'slug' => $concern['slug'],
                'name' => $concern['name'],
                'blurb' => $concern['blurb'],
                'image' => $concern['image'],
                'preview_images' => $previews,
                'count' => $count,
                'link' => '/shop?concern=' . $concern['slug'],
            ];
        })->filter(fn ($item) => $item['count'] > 0)->values();

        return response()->json([
            'success' => true,
            'data' => [
                'show' => ($settings['shop_by_concern_show'] ?? 'true') !== 'false',
                'eyebrow' => $settings['shop_by_concern_eyebrow'] ?? 'Shop by concern',
                'title' => $settings['shop_by_concern_title'] ?? 'Start where your skin is',
                'items' => $items,
            ],
        ]);
    }

    /**
     * Fetch products based on dynamic filters.
     */
    public function getProducts(Request $request)
    {
        $query = Product::where('status', 'published')
            ->with(['categories', 'images', 'variants', 'tags']);

        // Category filter (supports single slug, comma-separated slugs, or IDs)
        if ($request->filled('category')) {
            $categories = is_array($request->category) ? $request->category : explode(',', $request->category);
            $categories = array_filter(array_map('trim', $categories));
            if (!empty($categories)) {
                $query->whereHas('categories', function($q) use ($categories) {
                    $q->whereIn('categories.slug', $categories)
                      ->orWhereIn('categories.id', $categories);
                });
            }
        }

        // Collection filter (supports single slug, comma-separated slugs, or IDs)
        if ($request->filled('collection')) {
            $collections = is_array($request->collection) ? $request->collection : explode(',', $request->collection);
            $collections = array_filter(array_map('trim', $collections));
            if (!empty($collections)) {
                $query->whereHas('collections', function($q) use ($collections) {
                    $q->whereIn('collections.slug', $collections)
                      ->orWhereIn('collections.id', $collections);
                });
            }
        }

        // Shop-by-concern filter (mapping managed in Admin → Collections → Shop by concern)
        if ($request->filled('concern')) {
            $concern = collect($this->shopConcernItems())->firstWhere('slug', $request->concern);
            $concern ? $this->applyConcernFilter($query, $concern) : $query->whereRaw('1 = 0');
        }

        // Size filter
        if ($request->filled('size')) {
            $sizes = is_array($request->size) ? $request->size : explode(',', $request->size);
            $sizes = array_filter(array_map('trim', $sizes));
            if (!empty($sizes)) {
                $query->whereHas('variants', function($q) use ($sizes) {
                    $q->whereIn('size', $sizes)->where('stock_quantity', '>', 0);
                });
            }
        }

        // Color filter
        if ($request->filled('color')) {
            $colors = is_array($request->color) ? $request->color : explode(',', $request->color);
            $colors = array_filter(array_map('trim', $colors));
            if (!empty($colors)) {
                $query->whereHas('variants', function($q) use ($colors) {
                    $q->whereIn('color', $colors);
                });
            }
        }

        // Price filters
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float)$request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float)$request->max_price);
        }

        // Availability filter
        if ($request->filled('in_stock') && in_array($request->in_stock, ['true', '1', 1, true], true)) {
            $query->where(function($q) {
                $q->where('stock_quantity', '>', 0)
                  ->orWhereHas('variants', function($sub) {
                      $sub->where('stock_quantity', '>', 0);
                  });
            });
        }

        // Flash sale filter
        if ($request->filled('is_flash_sale') && in_array($request->is_flash_sale, ['true', '1', 1, true], true)) {
            $flashSaleEndTime = EcommerceSetting::where('ecommerce_id', Ecommerce::query()->value('id'))
                ->where('key', 'flash_sale_end_time')
                ->value('value');
            if (!empty($flashSaleEndTime) && strtotime($flashSaleEndTime) <= time()) {
                // Flash sale campaign has ended, return 0 products
                $query->whereRaw('1 = 0');
            } else {
                $query->where('is_flash_sale', true);
            }
        }

        // Featured filter
        if (($request->filled('is_featured') && in_array($request->is_featured, ['true', '1', 1, true], true)) ||
            ($request->filled('featured') && in_array($request->featured, ['true', '1', 1, true], true))) {
            $query->where('is_featured', true);
        }

        // Best seller filter
        if (($request->filled('is_best_seller') && in_array($request->is_best_seller, ['true', '1', 1, true], true)) ||
            ($request->filled('popular') && in_array($request->popular, ['true', '1', 1, true], true))) {
            $query->where('is_best_seller', true);
        }

        // Search query filter (accepts q or search)
        $searchTerm = $request->get('q', $request->get('search'));
        if (!empty($searchTerm)) {
            $q = trim($searchTerm);
            $query->where(function($sub) use ($q) {
                $sub->where('name', 'LIKE', "%{$q}%")
                   ->orWhere('description', 'LIKE', "%{$q}%")
                   ->orWhere('sku', 'LIKE', "%{$q}%")
                   ->orWhere('short_description', 'LIKE', "%{$q}%")
                   ->orWhereHas('categories', function($cat) use ($q) {
                       $cat->where('name', 'LIKE', "%{$q}%")
                          ->orWhere('slug', 'LIKE', "%{$q}%");
                   })
                   ->orWhereHas('tags', function($tag) use ($q) {
                       $tag->where('name', 'LIKE', "%{$q}%")
                          ->orWhere('slug', 'LIKE', "%{$q}%");
                   });
            });
        }

        // Sorting
        $sort = $request->get('sort', 'newest');
        switch ($sort) {
            case 'price_low':
            case 'price_asc':
            case 'price-asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
            case 'price_desc':
            case 'price-desc':
                $query->orderBy('price', 'desc');
                break;
            case 'popular':
            case 'bestselling':
            case 'best-selling':
                $query->orderBy('is_best_seller', 'desc')->orderBy('is_featured', 'desc')->orderBy('created_at', 'desc');
                break;
            case 'rating':
            case 'rating_desc':
            case 'rating-desc':
                $query->orderBy('rating_cache', 'desc')->orderBy('created_at', 'desc');
                break;
            case 'name_asc':
            case 'name-asc':
            case 'alpha_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
            case 'name-desc':
            case 'alpha_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $totalCount = (clone $query)->count();
        $perPageParam = $request->get('per_page', $request->get('limit', 12));
        if ($perPageParam === 'all' || $perPageParam === 'All' || (is_numeric($perPageParam) && (int)$perPageParam <= 0)) {
            $perPage = max(1, $totalCount);
        } else {
            $perPage = min(500, max(1, (int)$perPageParam));
        }

        $lastPage = max(1, (int)ceil($totalCount / $perPage));
        $requestedPage = max(1, (int)$request->get('page', 1));
        if ($requestedPage > $lastPage && $totalCount > 0) {
            $requestedPage = $lastPage;
        }

        $products = $query->paginate($perPage, ['*'], 'page', $requestedPage);
        $products->getCollection()->each(function (Product $product) {
            // Keep the legacy singular field during the multi-category transition.
            $product->setRelation('category', $product->categories->first());
        });

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Get specific product by slug.
     */
    public function getProductDetails($slug)
    {
        $product = Product::where('slug', $slug)
            ->where('status', 'published')
            ->with(['categories', 'images', 'variants', 'reviews', 'tags'])
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        $actualSold = OrderItem::where('product_id', $product->id)
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->sum('order_items.quantity');

        $productArray = $product->toArray();
        $productArray['category'] = $product->categories->first()?->toArray();
        $productArray['total_sold'] = (int)$actualSold + (int)($product->sales_override ?? 0);

        return response()->json([
            'success' => true,
            'data' => $productArray
        ]);
    }

    /**
     * Search products catalog.
     */
    public function search(Request $request)
    {
        $q = $request->get('q', '');
        if (empty($q)) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $products = Product::where('status', 'published')
            ->where(function($query) use ($q) {
                $query->where('name', 'LIKE', "%{$q}%")
                      ->orWhere('description', 'LIKE', "%{$q}%")
                      ->orWhere('sku', 'LIKE', "%{$q}%")
                      ->orWhere('short_description', 'LIKE', "%{$q}%")
                      ->orWhereHas('categories', function($sub) use ($q) {
                          $sub->where('name', 'LIKE', "%{$q}%")
                              ->orWhere('slug', 'LIKE', "%{$q}%");
                      })
                      ->orWhereHas('collections', function($sub) use ($q) {
                          $sub->where('name', 'LIKE', "%{$q}%")
                              ->orWhere('slug', 'LIKE', "%{$q}%");
                      })
                      ->orWhereHas('tags', function($sub) use ($q) {
                          $sub->where('name', 'LIKE', "%{$q}%");
                      });
            })
            ->with(['categories', 'images', 'variants'])
            ->limit(15)
            ->get();

        $products->each(function (Product $product) {
            $product->setRelation('category', $product->categories->first());
        });

        // Also fetch matching categories & collections for typeahead recommendations
        $categories = Category::where('name', 'LIKE', "%{$q}%")
            ->orWhere('slug', 'LIKE', "%{$q}%")
            ->limit(5)
            ->get();

        $collections = Collection::where('is_published', true)
            ->where(function($sub) use ($q) {
                $sub->where('name', 'LIKE', "%{$q}%")
                    ->orWhere('slug', 'LIKE', "%{$q}%");
            })
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
            'categories' => $categories,
            'collections' => $collections,
        ]);
    }

    /**
     * Search all entities: products, pages, and blog articles.
     */
    public function searchAll(Request $request)
    {
        $q = trim($request->get('q', ''));
        if (empty($q)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'products' => [],
                    'categories' => [],
                    'collections' => [],
                    'pages' => [],
                    'articles' => []
                ]
            ]);
        }

        // 1. Search Products
        $products = Product::where('status', 'published')
            ->where(function($query) use ($q) {
                $query->where('name', 'LIKE', "%{$q}%")
                      ->orWhere('description', 'LIKE', "%{$q}%")
                      ->orWhere('sku', 'LIKE', "%{$q}%")
                      ->orWhere('short_description', 'LIKE', "%{$q}%")
                      ->orWhereHas('categories', function($sub) use ($q) {
                          $sub->where('name', 'LIKE', "%{$q}%")
                              ->orWhere('slug', 'LIKE', "%{$q}%");
                      })
                      ->orWhereHas('collections', function($sub) use ($q) {
                          $sub->where('name', 'LIKE', "%{$q}%")
                              ->orWhere('slug', 'LIKE', "%{$q}%");
                      });
            })
            ->with(['categories', 'images'])
            ->limit(10)
            ->get();

        $products->each(function (Product $product) {
            $product->setRelation('category', $product->categories->first());
        });

        // 2. Search Categories
        $categories = Category::where('name', 'LIKE', "%{$q}%")
            ->orWhere('slug', 'LIKE', "%{$q}%")
            ->limit(5)
            ->get();

        // 3. Search Collections
        $collections = Collection::where('is_published', true)
            ->where(function($sub) use ($q) {
                $sub->where('name', 'LIKE', "%{$q}%")
                    ->orWhere('slug', 'LIKE', "%{$q}%");
            })
            ->limit(5)
            ->get();

        // 4. Search CMS Pages
        $pages = Page::where('title', 'LIKE', "%{$q}%")
            ->orWhere('content', 'LIKE', "%{$q}%")
            ->limit(5)
            ->get();

        // 5. Search Blog Articles
        $articles = Article::where('status', 'published')
            ->where(function($query) use ($q) {
                $query->where('title', 'LIKE', "%{$q}%")
                      ->orWhere('content', 'LIKE', "%{$q}%");
            })
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'categories' => $categories,
                'collections' => $collections,
                'pages' => $pages,
                'articles' => $articles
            ]
        ]);
    }

    /**
     * Apply coupon verification.
     */
    /**
     * Get active promotional coupons for storefront carousel.
     */
    public function getActiveCoupons()
    {
        $today = now()->startOfDay();
        $coupons = Coupon::where(function($q) use ($today) {
            $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
        })->where(function($q) use ($today) {
            $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
        })->get();

        return response()->json([
            'success' => true,
            'data' => $coupons
        ]);
    }

    public function verifyCoupon(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric',
        ]);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid discount coupon code'
            ], 400);
        }

        if (!$coupon->isValidForAmount($request->subtotal)) {
            return response()->json([
                'success' => false,
                'message' => 'Coupon requirements not met (date validity or minimum spend)'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Coupon applied successfully',
            'data' => $coupon
        ]);
    }

    /**
     * Place order checkout.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:50',
            'delivery_address' => 'required|string',
            'delivery_city' => 'required|string|max:255',
            'delivery_state' => 'required|string|max:255',
            'delivery_postcode' => ['nullable', 'string', 'max:20', Rule::requiredIf(fn () => \App\Support\Countries::isUk((string) request('delivery_country'))), function ($attr, $value, $fail) {
                if ($value && \App\Support\Countries::isUk((string) request('delivery_country')) && !\App\Support\Countries::validUkPostcode($value)) {
                    $fail('Enter a valid UK postcode, like SW1A 1AA.');
                }
            }],
            'delivery_country' => 'required|string|max:255',
            'shipping_rate_id' => 'required|integer|exists:shipping_rates,id',
            'payment_method' => 'required|in:paystack,bank_transfer,stripe,paypal,flutterwave,cash_on_delivery',
            'coupon_code' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $ecommerce = Ecommerce::first();
        if (!$ecommerce) {
            return response()->json(['success' => false, 'message' => 'Ecommerce context missing'], 500);
        }

        // Start transactional block
        return DB::transaction(function () use ($request, $ecommerce) {
            $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerce->id)->get();
            $settings = [];
            foreach ($settingsRaw as $s) {
                $settings[$s->key] = $s->value;
            }
            $oversellingEnabled = in_array($settings['allow_overselling'] ?? 'false', [true, 1, '1', 'true'], true);

            $paymentScopeKey = match ($request->payment_method) {
                'cash_on_delivery' => 'payment_cash_channel',
                'bank_transfer' => 'payment_transfer_channel',
                default => 'payment_card_channel',
            };
            if (!in_array($settings[$paymentScopeKey] ?? 'both', ['storefront', 'both'], true)) {
                return response()->json(['success' => false, 'message' => 'This payment method is not available on the storefront.'], 422);
            }

            // Refuse PayPal up front (before stock is reserved) if it can't take payments.
            if ($request->payment_method === 'paypal') {
                $paypalError = app(\App\Services\PayPalService::class)->getConfigError();
                if ($paypalError) {
                    return response()->json(['success' => false, 'message' => $paypalError], 422);
                }
            }

            if ($request->payment_method === 'cash_on_delivery') {
                $codEnabled = ($settings['cod_enabled'] ?? 'false') === 'true';
                if (!$codEnabled) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cash on Delivery is currently disabled'
                    ], 400);
                }
            }

            $subtotal = 0;
            $orderItemsToCreate = [];

            // Verify stock and calculate price per item
            foreach ($request->items as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);
                
                if ($product->status !== 'published') {
                    return response()->json([
                        'success' => false,
                        'message' => "Product '{$product->name}' is no longer available"
                    ], 400);
                }

                $variant = null;
                $variantLabel = null;
                $price = $product->price;
                if ($product->sale_price) {
                    $price = $product->sale_price;
                }

                if ($product->has_variants) {
                    if (empty($item['variant_id'])) {
                        return response()->json([
                            'success' => false,
                            'message' => "Please select a size/color variant for '{$product->name}'"
                        ], 400);
                    }

                    $variant = ProductVariant::lockForUpdate()->find($item['variant_id']);
                    if (!$variant || $variant->product_id != $product->id) {
                        return response()->json([
                            'success' => false,
                            'message' => "Invalid variant selected for '{$product->name}'"
                        ], 400);
                    }

                    if (!$oversellingEnabled && $variant->stock_quantity < $item['quantity']) {
                        return response()->json([
                            'success' => false,
                            'message' => "Insufficient stock for '{$product->name}' ({$variant->size}/{$variant->color}). Available: {$variant->stock_quantity}"
                        ], 400);
                    }

                    // Price overrides
                    if ($variant->price) {
                        $price = $variant->price;
                    }
                    if ($variant->sale_price) {
                        $price = $variant->sale_price;
                    }

                    $variantLabel = "Size: {$variant->size} | Color: {$variant->color}";

                    // Reduce variant stock
                    $oldStock = $variant->stock_quantity;
                    $variant->stock_quantity -= $item['quantity'];
                    $variant->save();

                    // Log inventory
                    InventoryLog::create([
                        'product_variant_id' => $variant->id,
                        'product_id' => $product->id,
                        'old_quantity' => $oldStock,
                        'new_quantity' => $variant->stock_quantity,
                        'change_amount' => -$item['quantity'],
                        'reason' => 'online_order',
                    ]);
                } else {
                    if (!$oversellingEnabled && $product->stock_quantity < $item['quantity']) {
                        return response()->json([
                            'success' => false,
                            'message' => "Insufficient stock for '{$product->name}'. Available: {$product->stock_quantity}"
                        ], 400);
                    }

                    // Reduce product stock
                    $oldStock = $product->stock_quantity;
                    $product->stock_quantity -= $item['quantity'];
                    $product->save();

                    // Log inventory
                    InventoryLog::create([
                        'product_variant_id' => null,
                        'product_id' => $product->id,
                        'old_quantity' => $oldStock,
                        'new_quantity' => $product->stock_quantity,
                        'change_amount' => -$item['quantity'],
                        'reason' => 'online_order',
                    ]);
                }

                $itemSubtotal = $price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $orderItemsToCreate[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant ? $variant->id : null,
                    'product_name' => $product->name,
                    'variant_label' => $variantLabel,
                    'price' => $price,
                    'quantity' => $item['quantity'],
                ];
            }

            // Shipping: the customer's chosen method must apply to this cart's
            // products, quantities and delivery country; its fixed charge is what we bill.
            $cartForShipping = collect($request->items)
                ->map(fn ($item) => ['product_id' => (int) $item['product_id'], 'quantity' => (int) $item['quantity']])
                ->all();
            $shippingMethod = app(\App\Services\ShippingCalculator::class)
                ->resolve((int) $request->shipping_rate_id, $request->delivery_country, $cartForShipping);

            if (!$shippingMethod) {
                return response()->json([
                    'success' => false,
                    'message' => 'That shipping option isn\'t available for the items in your bag and your country. Please choose another.',
                ], 422);
            }

            $deliveryFee = round((float) $shippingMethod->rate, 2);
            $deliveryMethod = $shippingMethod->is_pickup ? 'pickup' : 'delivery';
            $appliedShippingDetails = [[
                'id' => $shippingMethod->id,
                'name' => $shippingMethod->name,
                'rate' => $deliveryFee,
                'type' => 'flat',
                'amount' => $deliveryFee,
            ]];

            // Process Coupon
            $discountAmount = 0;
            if (!empty($request->coupon_code)) {
                $coupon = Coupon::where('code', $request->coupon_code)->first();
                if ($coupon && $coupon->isValidForAmount($subtotal)) {
                    if ($coupon->type == 'percentage') {
                        $discountAmount = ($coupon->value / 100) * $subtotal;
                    } elseif ($coupon->type == 'fixed_amount') {
                        $discountAmount = $coupon->value;
                    } elseif ($coupon->type == 'free_delivery') {
                        $deliveryFee = 0;
                    }
                }
            }

            // ===== Apply Automatic Discounts =====
            $autoDiscountAmount = 0;
            $appliedDiscountId = null;
            $activeDiscounts = Discount::where('is_active', true)->get()->filter(function ($d) {
                return $d->isCurrentlyActive();
            });

            foreach ($orderItemsToCreate as &$oItem) {
                $product = Product::find($oItem['product_id']);
                if (!$product) continue;

                foreach ($activeDiscounts as $discount) {
                    if (!$discount->appliesToProduct($product)) continue;

                    if ($discount->type === 'percentage') {
                        $itemDiscount = ($discount->value / 100) * ($oItem['price'] * $oItem['quantity']);
                        $autoDiscountAmount += $itemDiscount;
                        $appliedDiscountId = $discount->id;
                    } elseif ($discount->type === 'fixed_amount') {
                        $itemDiscount = min($discount->value, $oItem['price'] * $oItem['quantity']);
                        $autoDiscountAmount += $itemDiscount;
                        $appliedDiscountId = $discount->id;
                    } elseif ($discount->type === 'bogo') {
                        $minQty = $discount->min_qty_requirement ?? 2;
                        $freeQty = $discount->free_qty_reward ?? 1;
                        if ($oItem['quantity'] >= $minQty) {
                            $freeItems = floor($oItem['quantity'] / $minQty) * $freeQty;
                            $autoDiscountAmount += $freeItems * $oItem['price'];
                            $appliedDiscountId = $discount->id;
                        }
                    }
                    break; // Apply only the first matching discount per item
                }
            }
            unset($oItem); // break reference

            $discountAmount += $autoDiscountAmount;

            // ===== Apply Taxes =====
            $taxAmount = 0;
            $taxDetails = [];
            $activeTaxes = Tax::where('is_active', true)
                ->whereIn('sales_channel', ['storefront', 'both'])->get();

            $deliveryState = $request->delivery_state;
            $deliveryCountry = $request->delivery_country;

            $taxableAmount = $subtotal - $discountAmount;
            if ($taxableAmount < 0) $taxableAmount = 0;

            foreach ($activeTaxes as $tax) {
                if (!$tax->appliesToArea($deliveryState, $deliveryCountry)) continue;

                if ($tax->type === 'exclusive') {
                    // Exclusive: tax is added on top
                    $amount = round(($tax->rate / 100) * $taxableAmount, 2);
                    $taxAmount += $amount;
                    $taxDetails[] = ['name' => $tax->name, 'rate' => $tax->rate, 'type' => 'exclusive', 'amount' => $amount];
                } else {
                    // Inclusive: tax is already included in the price, just record it
                    $amount = round($taxableAmount - ($taxableAmount / (1 + ($tax->rate / 100))), 2);
                    $taxDetails[] = ['name' => $tax->name, 'rate' => $tax->rate, 'type' => 'inclusive', 'amount' => $amount];
                }
            }

            $totalAmount = round(($subtotal + $deliveryFee + $taxAmount) - $discountAmount, 2);
            if ($totalAmount < 0) {
                $totalAmount = 0;
            }

            // Generate Order Number
            $orderNumber = 'FQ-' . strtoupper(Str::random(6)) . '-' . rand(100, 999);

            // Identify customer (via sanctum token or by customer_email)
            $customerId = auth('sanctum')->id();
            if (!$customerId && !empty($request->customer_email)) {
                $matchedCustomer = Customer::where('email', $request->customer_email)->first();
                if ($matchedCustomer) {
                    $customerId = $matchedCustomer->id;
                }
            }

            // Create Order
            $order = Order::create([
                'ecommerce_id' => $ecommerce->id,
                'customer_id' => $customerId,
                'order_number' => $orderNumber,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'delivery_address' => $request->delivery_address,
                'delivery_city' => $request->delivery_city,
                'delivery_postcode' => $request->delivery_postcode ? strtoupper(trim($request->delivery_postcode)) : null,
                'delivery_state' => $request->delivery_state,
                'delivery_country' => $request->delivery_country,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'coupon_code' => !empty($request->coupon_code) ? $request->coupon_code : null,
                'discount_id' => $appliedDiscountId,
                'delivery_fee' => $deliveryFee,
                'applied_shipping' => $appliedShippingDetails,
                'tax_amount' => $taxAmount,
                'tax_details' => !empty($taxDetails) ? json_encode($taxDetails) : null,
                'total_amount' => $totalAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending',
                'order_status' => $request->payment_method === 'cash_on_delivery' ? 'processing' : 'pending_payment',
                'delivery_method' => $deliveryMethod,
                'notes' => $request->notes,
            ]);

            // Save and sync shipping data to Customer profile and CustomerAddress table for future prefilling
            if ($customerId) {
                $cust = Customer::find($customerId);
                if ($cust) {
                    if (!empty($request->customer_phone) && $cust->phone !== $request->customer_phone) {
                        $cust->phone = $request->customer_phone;
                        $cust->save();
                    }

                    if ($deliveryMethod === 'delivery' && !empty($request->delivery_address)) {
                        CustomerAddress::where('customer_id', $cust->id)->update(['is_default' => false]);
                        
                        $existingAddr = CustomerAddress::where('customer_id', $cust->id)
                            ->where('address_line_1', $request->delivery_address)
                            ->first();

                        if ($existingAddr) {
                            $existingAddr->update([
                                'city' => $request->delivery_city ?? '',
                                'postcode' => $request->delivery_postcode ? strtoupper(trim($request->delivery_postcode)) : $existingAddr->postcode,
                                'state' => $request->delivery_state ?? '',
                                'country' => $request->delivery_country ?? '',
                                'is_default' => true,
                            ]);
                        } else {
                            CustomerAddress::create([
                                'customer_id' => $cust->id,
                                'address_line_1' => $request->delivery_address,
                                'city' => $request->delivery_city ?? '',
                                'postcode' => $request->delivery_postcode ? strtoupper(trim($request->delivery_postcode)) : null,
                                'state' => $request->delivery_state ?? '',
                                'country' => $request->delivery_country ?? '',
                                'is_default' => true,
                            ]);
                        }
                    }
                }
            }

            // Save order items
            foreach ($orderItemsToCreate as $oItem) {
                $oItem['order_id'] = $order->id;
                OrderItem::create($oItem);
            }

            // Order confirmation to the customer and an alert to the store, sent once the
            // order is committed so a rolled-back checkout never emails anyone.
            $orderItemsForEmail = $orderItemsToCreate;
            DB::afterCommit(function () use ($order, $orderItemsForEmail) {
                try {
                    if (!empty($order->customer_email)) {
                        Mail::to($order->customer_email)->send(new OrderInvoiceMail($order, 'order_placed'));
                    }
                } catch (\Throwable $mailEx) {
                    Log::warning("Could not dispatch order_placed email to {$order->customer_email}: " . $mailEx->getMessage());
                }

                StoreMailer::send(StoreMailer::storeInbox(), new StoreMessage(
                    subjectLine: "New order #{$order->order_number}: " . StoreMailer::money($order->total_amount),
                    heading: 'You have a new order',
                    paragraphs: [$order->payment_method === 'bank_transfer'
                        ? 'The customer chose bank transfer. Check the payment has arrived before dispatching.'
                        : 'Payment status will update automatically once the customer completes payment.'],
                    details: [
                        'Order' => '#' . $order->order_number,
                        'Total' => StoreMailer::money($order->total_amount),
                        'Customer' => trim($order->customer_name . ' · ' . $order->customer_email . ' · ' . $order->customer_phone, ' ·'),
                        'Items' => collect($orderItemsForEmail)->map(fn ($i) => $i['quantity'] . ' × ' . ($i['product_name'] ?? 'Item'))->implode("\n"),
                        'Delivery' => $order->delivery_method === 'pickup'
                            ? 'Pick up'
                            : implode(', ', array_filter([$order->delivery_address, $order->delivery_city, $order->delivery_postcode, $order->delivery_country])),
                        'Payment' => ucwords(str_replace('_', ' ', $order->payment_method)),
                    ],
                    buttonText: 'Open order',
                    buttonUrl: url('/admin/orders/' . $order->id),
                    replyToAddress: $order->customer_email,
                    replyToName: $order->customer_name,
                ));
            });

            // Handle Payment Gateways Initiation (Paystack, Stripe, PayPal, Flutterwave)
            if (in_array($request->payment_method, ['paystack', 'stripe', 'paypal', 'flutterwave'])) {
                // Initialize payment logs
                $reference = 'PAY-' . Str::uuid();
                Payment::create([
                    'order_id' => $order->id,
                    'transaction_reference' => $reference,
                    'gateway' => $request->payment_method,
                    'amount' => $totalAmount,
                    'status' => 'pending',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Order created. Complete payment with ' . ucfirst($request->payment_method) . '.',
                    'data' => [
                        'order_number' => $order->order_number,
                        'total_amount' => $totalAmount,
                        'email' => $order->customer_email,
                        'reference' => $reference,
                        'payment_method' => $request->payment_method,
                    ]
                ]);
            }

            // Handle Cash on Delivery
            if ($request->payment_method === 'cash_on_delivery') {
                return response()->json([
                    'success' => true,
                    'message' => 'Order placed successfully under Cash on Delivery.',
                    'data' => [
                        'order_number' => $order->order_number,
                        'total_amount' => $totalAmount,
                        'payment_method' => 'cash_on_delivery',
                    ]
                ]);
            }

            // Bank Transfer manual payment
            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully. Please proceed with the bank transfer.',
                'data' => [
                    'order_number' => $order->order_number,
                    'total_amount' => $totalAmount,
                    'payment_method' => 'bank_transfer',
                ]
            ]);
        });
    }

    /**
     * Verify Multi-Gateway Payment Transaction (Paystack, Stripe, PayPal, Flutterwave)
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'reference' => 'required|string',
            'order_number' => 'required|string',
            'gateway' => 'nullable|string',
        ]);

        $order = Order::where('order_number', $request->order_number)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        // The order decides which gateway verifies it; the client can't pick an easier one.
        $gateway = strtolower((string) $order->payment_method);
        if ($request->filled('gateway') && strtolower($request->gateway) !== $gateway) {
            return response()->json(['success' => false, 'message' => 'Payment method does not match this order.'], 422);
        }
        if ($gateway === 'paypal') {
            return response()->json(['success' => false, 'message' => 'PayPal payments are confirmed through PayPal checkout.'], 422);
        }
        if (!in_array($gateway, ['paystack', 'stripe', 'flutterwave'], true)) {
            return response()->json(['success' => false, 'message' => 'This order cannot be verified online.'], 422);
        }

        // Simulated payments (references containing "mock", missing or test keys) are dev/test only.
        $allowSimulation = (bool) config('services.payments.allow_simulation', false);

        $payment = Payment::where('transaction_reference', $request->reference)->first();
        if ($payment && $payment->order_id !== $order->id) {
            return response()->json(['success' => false, 'message' => 'This payment reference belongs to a different order.'], 422);
        }
        if (!$payment) {
            $payment = Payment::create([
                'order_id' => $order->id,
                'transaction_reference' => $request->reference,
                'gateway' => $gateway,
                'amount' => $order->total_amount,
                'status' => 'pending',
            ]);
        }

        if ($payment->status === 'success' && $order->payment_status === 'paid') {
            return response()->json([
                'success' => true,
                'message' => 'Payment already verified successfully.',
                'data' => $order
            ]);
        }

        // Fetch Gateway Settings
        $settingsRaw = EcommerceSetting::where('ecommerce_id', $order->ecommerce_id ?? 1)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        $isVerified = false;
        $gatewayResponse = ['mock' => true];

        // 1. STRIPE GATEWAY VERIFICATION
        if ($gateway === 'stripe') {
            $stripeSecret = $settings['stripe_key_secret'] ?? config('services.stripe.secret') ?? '';
            $isMockStripe = $allowSimulation && (Str::contains($request->reference, 'mock') || empty($stripeSecret) || Str::startsWith($stripeSecret, 'sk_test_mock'));

            if ($isMockStripe) {
                $isVerified = true;
                $gatewayResponse = ['gateway' => 'stripe', 'status' => 'succeeded', 'mode' => 'sandbox_mock'];
            } else {
                try {
                    $response = Http::withBasicAuth($stripeSecret, '')
                        ->get("https://api.stripe.com/v1/payment_intents/" . urlencode($request->reference));
                    if ($response->successful()) {
                        $resData = $response->json();
                        if (in_array($resData['status'] ?? '', ['succeeded', 'processing', 'requires_capture'])) {
                            $isVerified = true;
                            $gatewayResponse = $resData;
                        }
                    } else {
                        // Check charges endpoint fallback
                        $chargeRes = Http::withBasicAuth($stripeSecret, '')
                            ->get("https://api.stripe.com/v1/charges/" . urlencode($request->reference));
                        if ($chargeRes->successful() && ($chargeRes->json('status') === 'succeeded' || $chargeRes->json('paid') === true)) {
                            $isVerified = true;
                            $gatewayResponse = $chargeRes->json();
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning("Stripe verify api call: " . $e->getMessage());
                    // Fallback to verified if test transaction
                    if ($allowSimulation && Str::startsWith($stripeSecret, 'sk_test_')) {
                        $isVerified = true;
                    }
                }
            }
        }
        // 2. PAYPAL GATEWAY VERIFICATION
        // 3. PAYSTACK / FLUTTERWAVE GATEWAY VERIFICATION
        else {
            $paystackSecret = $settings['paystack_key_secret'] ?? config('services.paystack.secret_key') ?? '';
            $isMockPaystack = $allowSimulation && (Str::contains($request->reference, 'mock') || empty($paystackSecret) || Str::startsWith($paystackSecret, 'sk_test_mock'));

            if ($isMockPaystack) {
                $isVerified = true;
                $gatewayResponse = ['gateway' => 'paystack', 'status' => 'success', 'mode' => 'sandbox_mock'];
            } else {
                try {
                    $response = Http::withToken($paystackSecret)
                        ->get("https://api.paystack.co/transaction/verify/" . urlencode($request->reference));
                    if ($response->successful()) {
                        $resData = $response->json();
                        if ($resData['status'] && ($resData['data']['status'] ?? '') === 'success') {
                            $isVerified = true;
                            $gatewayResponse = $resData;
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning("Paystack verify error: " . $e->getMessage());
                    if ($allowSimulation && Str::startsWith($paystackSecret, 'sk_test_')) {
                        $isVerified = true;
                    }
                }
            }
        }

        // Process outcome
        if ($isVerified) {
            $payment->status = 'success';
            $payment->gateway_response = $gatewayResponse;
            $payment->save();

            $order->payment_status = 'paid';
            $order->order_status = 'paid';
            $order->paid_at = now();
            $order->save();

            // Generate branded PDF Invoice & dispatch invoice email notification
            try {
                $pdfPath = null;
                $ecommerce = Ecommerce::first();
                $data = [
                    'order' => $order,
                    'ecommerceName' => $ecommerce->name ?? 'Dansolam',
                    'storeAddress' => $settings['store_address'] ?? 'Customer Care SHOP',
                    'whatsappNumber' => $settings['store_whatsapp'] ?? ($settings['store_phone'] ?? '+234 800 000 0000'),
                    'themeColor' => $settings['theme_primary_color'] ?? '#5D3E85',
                    'logoUrl' => !empty($settings['store_logo_url']) ? asset($settings['store_logo_url']) : null,
                ];

                $pdfDir = storage_path('app/invoices');
                if (!file_exists($pdfDir)) {
                    mkdir($pdfDir, 0755, true);
                }
                $pdfPath = "{$pdfDir}/invoice_{$order->order_number}.pdf";
                $pdf = Pdf::loadView('exports.invoice', $data);
                $pdf->save($pdfPath);

                if (!empty($order->customer_email)) {
                    Mail::to($order->customer_email)->send(new OrderInvoiceMail($order, 'invoice', $pdfPath));
                }
            } catch (\Throwable $ex) {
                Log::warning("Could not dispatch invoice email for order #{$order->order_number}: " . $ex->getMessage());
            }

            StoreMailer::paymentReceived($order, $gateway);

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully with ' . ucfirst($gateway) . '.',
                'data' => $order
            ]);
        }

        $payment->status = 'failed';
        $payment->save();

        return response()->json([
            'success' => false,
            'message' => 'Payment verification failed with ' . ucfirst($gateway) . '. Please check transaction.'
        ], 400);
    }

    /**
     * Track Order status.
     */
    public function trackOrder(Request $request)
    {
        $request->validate([
            'order_number' => 'required|string',
            'contact' => 'nullable|string', // phone or email (optional)
        ]);

        $orderNumber = trim($request->order_number);
        $contact = trim($request->contact ?? '');

        $query = Order::where(function($q) use ($orderNumber) {
            $q->where('order_number', $orderNumber)
              ->orWhere('order_number', 'LIKE', "%{$orderNumber}%");
        });

        if (!empty($contact)) {
            $query->where(function($q) use ($contact) {
                $q->where('customer_email', $contact)
                  ->orWhere('customer_phone', $contact)
                  ->orWhere('customer_phone', 'LIKE', "%{$contact}%");
            });
        }

        $order = $query->with(['items.product', 'items.variant'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found with provided tracking credentials'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Submit Product Review.
     */
    public function addReview(Request $request, $productId = null)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'avatar_url' => 'nullable|string',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'image_url' => 'nullable|string',
        ]);

        $realProductId = ($productId === 'null' || $productId === 'none' || !$productId) ? null : $productId;

        $review = Review::create([
            'product_id' => $realProductId,
            'customer_name' => $request->customer_name,
            'avatar_url' => $request->avatar_url,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'image_url' => $request->image_url,
            'is_approved' => false, // Require admin approval by default for standard reviews
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully and is awaiting moderation.',
            'data' => $review
        ]);
    }

    /**
     * Get legal policies and about page details.
     */
    public function getPage($slug)
    {
        $page = Page::where('slug', $slug)
            ->orWhere(function($q) use ($slug) {
                if ($slug === 'about-us') {
                    $q->where('slug', 'about');
                } elseif ($slug === 'about') {
                    $q->where('slug', 'about-us');
                }
            })
            ->first();

        if (!$page) {
            if ($slug === 'about-us' || $slug === 'about') {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'title' => 'About Dansolam Beauty Home',
                        'slug' => 'about-us',
                        'content' => 'Dansolam Beauty Home is a premier luxury skincare, cosmetics, and botanical sanctuary dedicated to empowering natural radiance and timeless beauty.',
                        'meta_title' => 'About Us - Dansolam Beauty Home',
                        'meta_description' => 'Learn about Dansolam Beauty Home, our heritage, organic beauty formulations, and luxury skincare sanctuary.'
                    ]
                ]);
            }


            return response()->json([
                'success' => false,
                'message' => 'Page not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $page
        ]);
    }

    /**
     * Subscribe to newsletter list.
     */
    public function subscribeNewsletter(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $exists = DB::table('newsletter_subscribers')->where('email', $request->email)->exists();
        if ($exists) {
            return response()->json([
                'success' => true,
                'message' => 'You are already subscribed to our ecommerce updates!'
            ]);
        }

        DB::table('newsletter_subscribers')->insert([
            'email' => $request->email,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        StoreMailer::send($request->email, new StoreMessage(
            subjectLine: "You're subscribed to Dansolam",
            heading: 'Thank you for subscribing',
            paragraphs: [
                "You're now on the Dansolam list. We'll send you new arrivals, skincare tips and subscriber-only offers, never spam.",
                'If you did not sign up, you can ignore this email or reply and we will remove you.',
            ],
            buttonText: 'Browse the shop',
            buttonUrl: url('/shop'),
        ));

        return response()->json([
            'success' => true,
            'message' => 'Thank you for subscribing! Keep an eye on your inbox for designer drops.'
        ]);
    }

    /**
     * Fetch visible gallery items.
     */
    public function getGalleryItems()
    {
        $items = GalleryItem::where('is_visible', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    /**
     * Fetch published articles.
     */
    public function getArticles()
    {
        $articles = Article::with(['category', 'tags'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }

    /**
     * Fetch single article details.
     */
    public function getArticleDetails($slug)
    {
        $article = Article::with(['category', 'tags'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $article
        ]);
    }

    /**
     * Submit contact form inquiry.
     */
    public function submitContactInquiry(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|min:10',
        ]);

        $inquiry = \App\Models\ContactInquiry::create([
            'name' => $request->name,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
        ]);

        StoreMailer::send($request->email, new StoreMessage(
            subjectLine: 'We received your message - Dansolam',
            heading: 'Thanks for getting in touch, ' . strtok(trim($request->name), ' '),
            paragraphs: [
                'We have received your message and a member of our team will reply as soon as possible, usually within one working day (Monday to Saturday, 9am to 6pm).',
                'Here is a copy of what you sent:',
            ],
            details: ['Subject' => $request->subject, 'Message' => $request->message],
        ));

        StoreMailer::send(StoreMailer::storeInbox(), new StoreMessage(
            subjectLine: 'New enquiry: ' . $request->subject,
            heading: 'New contact form enquiry',
            paragraphs: ['Reply to this email to answer ' . $request->name . ' directly.'],
            details: [
                'From' => $request->name . ' <' . $request->email . '>',
                'Subject' => $request->subject,
                'Message' => $request->message,
            ],
            buttonText: 'View enquiries',
            buttonUrl: url('/admin/inquiries'),
            replyToAddress: $request->email,
            replyToName: $request->name,
        ));

        return response()->json([
            'success' => true,
            'message' => 'Your inquiry has been submitted successfully! We will get back to you shortly.'
        ]);
    }

    /**
     * Get all FAQs.
     */
    public function getFaqs(Request $request)
    {
        $q = $request->get('q', '');
        $query = \App\Models\Faq::orderBy('sort_order', 'asc');
        
        if (!empty($q)) {
            $query->where(function($sub) use ($q) {
                $sub->where('question', 'LIKE', "%{$q}%")
                    ->orWhere('answer', 'LIKE', "%{$q}%");
            });
        }
        
        $faqs = $query->get();
        return response()->json([
            'success' => true,
            'data' => $faqs
        ]);
    }

    /**
     * Get all featured brands.
     */
    public function getBrands()
    {
        $brands = \App\Models\Brand::where('is_featured', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();
        return response()->json([
            'success' => true,
            'data' => $brands
        ]);
    }

    public function getReviews(Request $request)
    {
        $query = \App\Models\Review::with('product')
            ->where('is_approved', true);

        // Sorting
        $sort = $request->get('sort', 'recent');
        if ($sort === 'highest') {
            $query->orderBy('rating', 'desc')->orderBy('created_at', 'desc');
        } elseif ($sort === 'lowest') {
            $query->orderBy('rating', 'asc')->orderBy('created_at', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Photos filter
        if ($request->boolean('with_photos')) {
            $query->whereNotNull('image_url');
        }

        // Product filter
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $reviews = $query->paginate($request->get('limit', 12));

        // Compute overall metrics across all approved reviews
        $allApproved = \App\Models\Review::where('is_approved', true)->get(['rating']);
        $totalCount = $allApproved->count();
        $avgRating = $totalCount > 0 ? round($allApproved->avg('rating'), 1) : 5.0;

        $starCounts = [
            5 => $allApproved->where('rating', 5)->count(),
            4 => $allApproved->where('rating', 4)->count(),
            3 => $allApproved->where('rating', 3)->count(),
            2 => $allApproved->where('rating', 2)->count(),
            1 => $allApproved->where('rating', 1)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'summary' => [
                'total_count' => $totalCount,
                'average_rating' => $avgRating,
                'star_counts' => $starCounts,
            ]
        ]);
    }

    public function storeFittingSession(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'preferred_date' => 'required|date|after_or_equal:today',
            'preferred_time' => 'required|string|max:50',
            'guests_count' => 'nullable|integer|min:1|max:20',
            'notes' => 'nullable|string|max:1000',
        ]);

        $ecommerce = Ecommerce::first();

        $session = \App\Models\FittingSession::create([
            'ecommerce_id' => $ecommerce?->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'preferred_date' => $validated['preferred_date'],
            'preferred_time' => $validated['preferred_time'],
            'guests_count' => $validated['guests_count'] ?? 1,
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        $booking = [
            'Date' => \Carbon\Carbon::parse($validated['preferred_date'])->format('l j F Y'),
            'Time' => $validated['preferred_time'],
            'Guests' => (string) ($validated['guests_count'] ?? 1),
            'Notes' => $validated['notes'] ?? null,
        ];

        StoreMailer::send($validated['email'], new StoreMessage(
            subjectLine: 'We received your consultation request - Dansolam',
            heading: 'Your request is in, ' . strtok(trim($validated['name']), ' '),
            paragraphs: [
                'Thank you for booking a consultation with Dansolam. This is a request, not yet a confirmed appointment: we will contact you shortly to confirm the time.',
            ],
            details: $booking,
        ));

        StoreMailer::send(StoreMailer::storeInbox(), new StoreMessage(
            subjectLine: 'New consultation request from ' . $validated['name'],
            heading: 'New consultation request',
            paragraphs: ['Please contact the customer to confirm, then update the request in the admin panel.'],
            details: ['Name' => $validated['name'], 'Email' => $validated['email'], 'Phone' => $validated['phone']] + $booking,
            buttonText: 'View requests',
            buttonUrl: url('/admin/fitting-sessions'),
            replyToAddress: $validated['email'],
            replyToName: $validated['name'],
        ));

        return response()->json([
            'success' => true,
            'message' => 'Your fitting session request has been submitted successfully! Our team will contact you shortly to confirm.',
            'data' => $session,
        ], 201);
    }
}
