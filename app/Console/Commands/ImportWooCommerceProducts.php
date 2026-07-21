<?php

namespace App\Console\Commands;

use App\Models\Banner;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Ecommerce;
use App\Models\GalleryItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductTag;
use App\Models\ProductVariant;
use App\Models\Review;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportWooCommerceProducts extends Command
{
    protected $signature = 'dansolam:import-wc
                            {csv : Path to the WooCommerce product export CSV}
                            {--tenant-name=Dansolam : Name of the Ecommerce tenant to attach products to}
                            {--wipe : Truncate products, categories, tags, images, variants, collections, reviews, banners, galleries before import}';

    protected $description = 'Import products, categories, tags, and images from a WooCommerce product export CSV into Dansolam.';

    public function handle(): int
    {
        $csvPath = (string) $this->argument('csv');
        $tenantName = (string) $this->option('tenant-name');
        $wipe = (bool) $this->option('wipe');

        if (!is_file($csvPath)) {
            $this->error("CSV not found: {$csvPath}");
            return self::FAILURE;
        }

        // ---- 1. Ensure tenant ----
        $tenantSlug = Str::slug($tenantName);
        $tenant = Ecommerce::firstOrCreate(
            ['slug' => $tenantSlug],
            ['name' => $tenantName, 'status' => 'active']
        );
        $this->info("Tenant: {$tenant->name} (#{$tenant->id})");

        // ---- 2. Optional wipe ----
        if ($wipe) {
            $this->warn('--wipe: removing existing product/category/tag/image/variant/collection/review/banner/gallery data');
            DB::transaction(function () {
                // Delete dependents first (respect FKs even though onDelete=cascade is set)
                DB::table('product_product_tag')->delete();
                DB::table('category_product')->delete();
                DB::table('collection_product')->delete();
                DB::table('shipping_rate_product')->delete();
                DB::table('discount_product')->delete();
                DB::table('category_collection')->delete();
                DB::table('product_images')->delete();
                ProductVariant::query()->delete();
                // Detach products from reviews (set product_id NULL) before deleting products
                Review::query()->whereNotNull('product_id')->update(['product_id' => null]);
                Product::query()->delete();
                Category::query()->delete();
                ProductTag::query()->delete();
                Collection::query()->delete();
                Banner::query()->delete();
                GalleryItem::query()->delete();
            });
        }

        // ---- 3. Parse CSV ----
        $rows = $this->readCsv($csvPath);
        $this->info('Parsed ' . count($rows) . ' product rows');

        // ---- 4. Build unique categories and tags ----
        $categoryNames = collect();
        $tagNames = collect();
        foreach ($rows as $row) {
            foreach ($this->splitList($row['Categories'] ?? '') as $c) {
                $categoryNames->push($c);
            }
            foreach ($this->splitList($row['Tags'] ?? '') as $t) {
                $tagNames->push($t);
            }
        }
        $categoryNames = $categoryNames->unique()->sort()->values();
        $tagNames = $tagNames->unique()->sort()->values();

        $this->info('Unique categories: ' . $categoryNames->count());
        $this->info('Unique tags: ' . $tagNames->count());

        $categoryByName = [];
        foreach ($categoryNames as $name) {
            $cat = Category::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'is_visible' => true]
            );
            $categoryByName[$name] = $cat->id;
        }

        $tagByName = [];
        foreach ($tagNames as $name) {
            $tag = ProductTag::firstOrCreate(
                ['name' => $name],
                []
            );
            $tagByName[$name] = $tag->id;
        }

        // ---- 5. Import each product ----
        $ok = 0;
        $failed = 0;
        foreach ($rows as $i => $row) {
            $lineNo = $i + 2; // +1 for header, +1 for 1-index
            try {
                $this->importProduct($row, $tenant->id, $categoryByName, $tagByName);
                $ok++;
            } catch (\Throwable $e) {
                $failed++;
                $this->error("Line {$lineNo} [{$row['Name']}]: " . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info("Imported: {$ok}, Failed: {$failed}");
        $this->info("Final counts → Products: " . Product::count()
            . ", Categories: " . Category::count()
            . ", ProductTags: " . ProductTag::count()
            . ", ProductImages: " . ProductImage::count());

        return self::SUCCESS;
    }

    private function importProduct(array $row, int $tenantId, array $categoryByName, array $tagByName): void
    {
        $name = trim((string) ($row['Name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('Empty product name');
        }

        $slug = $this->uniqueSlug(Str::slug($name) ?: Str::random(8));
        $sku = trim((string) ($row['SKU'] ?? '')) ?: null;
        $regular = $this->money($row['Regular price'] ?? null);
        $sale = $this->money($row['Sale price'] ?? null);
        $stock = (int) ($row['Stock'] ?? 0);
        $lowStock = (int) ($row['Low stock amount'] ?? 0);
        $featured = ((string) ($row['Is featured?'] ?? '0')) === '1';
        $published = ((string) ($row['Published'] ?? '1')) === '1';
        $inStock = ((string) ($row['In stock?'] ?? '1')) === '1';
        $backorders = strtolower(trim((string) ($row['Backorders allowed?'] ?? '')));
        $shortDesc = $this->cleanText($row['Short description'] ?? '');
        $longDesc = $this->cleanText($row['Description'] ?? '');

        $status = $published ? 'published' : 'draft';

        $product = Product::create([
            'ecommerce_id' => $tenantId,
            'name' => $name,
            'slug' => $slug,
            'sku' => $sku,
            'description' => $longDesc,
            'short_description' => $this->fitColumn($shortDesc ?: $longDesc, 255),
            'price' => $regular,
            'sale_price' => $sale,
            'cost_price' => null,
            'status' => $status,
            'is_featured' => $featured,
            'is_new_arrival' => false,
            'is_best_seller' => false,
            'is_flash_sale' => (bool) $sale,
            'has_variants' => false,
            'stock_quantity' => $inStock ? $stock : 0,
            'low_stock_threshold' => $lowStock > 0 ? $lowStock : 3,
            'seo_title' => $this->fitColumn($name, 255),
            'seo_description' => Str::limit(strip_tags($shortDesc ?: $longDesc), 500, ''),
        ]);

        // categories
        $catIds = [];
        foreach ($this->splitList($row['Categories'] ?? '') as $c) {
            if (isset($categoryByName[$c])) {
                $catIds[] = $categoryByName[$c];
            }
        }
        if ($catIds) {
            $product->categories()->sync($catIds);
        }

        // tags
        $tagIds = [];
        foreach ($this->splitList($row['Tags'] ?? '') as $t) {
            if (isset($tagByName[$t])) {
                $tagIds[] = $tagByName[$t];
            }
        }
        if ($tagIds) {
            $product->tags()->sync($tagIds);
        }

        // images
        $imageUrls = array_values(array_filter(array_map('trim', explode(',', (string) ($row['Images'] ?? '')))));
        if ($imageUrls) {
            $this->info("  [{$name}] downloading " . count($imageUrls) . ' image(s)');
            $sort = 0;
            foreach ($imageUrls as $url) {
                $stored = $this->downloadImage($url, $slug, $sort);
                if ($stored) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $stored,
                        'sort_order' => $sort,
                    ]);
                    $sort++;
                }
            }
        }
    }

    private function downloadImage(string $url, string $productSlug, int $sort): ?string
    {
        try {
            $ext = $this->guessExtension($url);
            $filename = ($sort + 1) . '.' . $ext;
            $relativeDir = "products/{$productSlug}";
            $relativePath = "{$relativeDir}/{$filename}";

            if (Storage::disk('public')->exists($relativePath)) {
                return '/storage/' . $relativePath;
            }

            $response = Http::timeout(20)->retry(2, 1000)->get($url);
            if (!$response->successful()) {
                $this->warn("    ! download failed ({$response->status()}): {$url}");
                return null;
            }

            Storage::disk('public')->put($relativePath, $response->body());
            return '/storage/' . $relativePath;
        } catch (ConnectionException $e) {
            $this->warn("    ! connection error: {$url} ({$e->getMessage()})");
            return null;
        } catch (\Throwable $e) {
            $this->warn("    ! image error: {$url} ({$e->getMessage()})");
            return null;
        }
    }

    private function guessExtension(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
        return in_array($ext, $allowed, true) ? ($ext === 'jpeg' ? 'jpg' : $ext) : 'jpg';
    }

    private function readCsv(string $path): array
    {
        $rows = [];
        if (($h = fopen($path, 'r')) === false) {
            throw new \RuntimeException("Cannot open CSV: {$path}");
        }
        $headers = fgetcsv($h);
        if (!$headers) {
            fclose($h);
            throw new \RuntimeException('CSV has no header row');
        }
        while (($data = fgetcsv($h)) !== false) {
            if (count($data) === 1 && trim((string) $data[0]) === '') {
                continue;
            }
            $row = array_combine($headers, array_pad($data, count($headers), null));
            $rows[] = array_map(fn($v) => is_string($v) ? $v : (string) $v, $row);
        }
        fclose($h);
        return $rows;
    }

    private function splitList(string $value): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }

    private function money(?string $value): ?float
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        return (float) $value;
    }

    private function cleanText(string $value): string
    {
        $value = str_replace(["\r\n", "\r"], "\n", $value);
        $value = preg_replace('/&nbsp;/i', ' ', $value) ?? $value;
        return trim($value);
    }

    private function fitColumn(string $value, int $max): string
    {
        $clean = strip_tags($this->cleanText($value));
        if (function_exists('mb_strcut') && mb_strlen($clean) > $max) {
            return mb_strcut($clean, 0, $max);
        }
        return strlen($clean) > $max ? substr($clean, 0, $max) : $clean;
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base !== '' ? $base : Str::random(8);
        $i = 1;
        while (Product::where('slug', $slug)->exists()) {
            $i++;
            $slug = $base . '-' . $i;
        }
        return $slug;
    }
}
