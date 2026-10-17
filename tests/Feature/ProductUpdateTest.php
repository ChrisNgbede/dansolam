<?php

namespace Tests\Feature;

use App\Models\Ecommerce;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Editing a product saves its images and size/colour variants, not just its fields.
 */
class ProductUpdateTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $store = Ecommerce::first() ?? Ecommerce::create([
            'name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'info@dansolam.com', 'currency' => 'GBP', 'is_active' => true,
        ]);

        $this->product = Product::create([
            'ecommerce_id' => $store->id, 'name' => 'Body Cream', 'slug' => 'body-cream', 'sku' => 'BC-1',
            'price' => 20, 'stock_quantity' => 10, 'status' => 'published', 'has_variants' => false,
        ]);
        ProductImage::create(['product_id' => $this->product->id, 'image_url' => '/storage/products/old.webp', 'sort_order' => 0]);
        ProductVariant::create([
            'product_id' => $this->product->id, 'sku' => 'BC-1', 'size' => 'One Size', 'color' => 'Standard',
            'stock_quantity' => 10, 'low_stock_threshold' => 1, 'image_url' => '/storage/products/old.webp', 'status' => 'active',
        ]);

        Sanctum::actingAs(User::factory()->create());
    }

    private function update(array $overrides): \Illuminate\Testing\TestResponse
    {
        return $this->putJson("/api/admin/products/{$this->product->id}", $overrides + [
            'name' => 'Body Cream', 'sku' => 'BC-1', 'price' => 20, 'status' => 'published',
            'has_variants' => false, 'stock_quantity' => 10, 'low_stock_threshold' => 5,
            'is_featured' => false, 'is_new_arrival' => false, 'is_best_seller' => false,
        ])->assertOk();
    }

    public function test_uploaded_images_are_saved_in_order(): void
    {
        $this->update(['images' => [url('/storage/uploads/new.webp'), '/storage/products/old.webp']]);

        // Same-site URLs are stored as paths; the first image is the main one.
        $this->assertSame(
            ['/storage/uploads/new.webp', '/storage/products/old.webp'],
            $this->product->images()->pluck('image_url')->all()
        );
        // The product's variant now shows the new main image.
        $this->assertSame('/storage/uploads/new.webp', $this->product->variants()->first()->image_url);
    }

    public function test_removed_images_are_deleted(): void
    {
        $this->update(['images' => ['/storage/uploads/only.webp']]);

        $this->assertSame(['/storage/uploads/only.webp'], $this->product->images()->pluck('image_url')->all());
    }

    public function test_leaving_images_out_keeps_them(): void
    {
        $this->update([]);

        $this->assertSame(['/storage/products/old.webp'], $this->product->images()->pluck('image_url')->all());
    }

    public function test_variants_are_updated_added_and_removed(): void
    {
        $existing = $this->product->variants()->first();

        $this->update([
            'has_variants' => true,
            'stock_quantity' => 0,
            'variants' => [
                ['id' => $existing->id, 'size' => '250ml', 'color' => 'Gold', 'stock_quantity' => 4, 'price' => ''],
                ['size' => '500ml', 'color' => 'Gold', 'stock_quantity' => 6, 'price' => 30],
            ],
        ]);

        $variants = $this->product->variants()->orderBy('id')->get();
        $this->assertCount(2, $variants);
        $this->assertSame($existing->id, $variants[0]->id);
        $this->assertSame(['250ml', 4], [$variants[0]->size, $variants[0]->stock_quantity]);
        $this->assertSame(['500ml', 6], [$variants[1]->size, $variants[1]->stock_quantity]);
        // Product stock is the total of its variants, not the 0 the form sends.
        $this->assertSame(10, $this->product->fresh()->stock_quantity);

        $this->update([
            'has_variants' => true,
            'stock_quantity' => 0,
            'variants' => [['id' => $variants[1]->id, 'size' => '500ml', 'color' => 'Gold', 'stock_quantity' => 6]],
        ]);

        $this->assertSame([$variants[1]->id], $this->product->variants()->pluck('id')->all());
        $this->assertSame(6, $this->product->fresh()->stock_quantity);
    }
}
