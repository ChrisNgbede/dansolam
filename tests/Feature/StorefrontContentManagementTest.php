<?php

namespace Tests\Feature;

use App\Models\Ecommerce;
use App\Models\Page;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\StorefrontContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * End-to-end checks that content edited in the admin API is what the storefront API serves.
 */
class StorefrontContentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(StorefrontContentSeeder::class);
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_migrated_about_content_is_served_to_the_storefront(): void
    {
        $this->getJson('/api/pages/about-us')
            ->assertOk()
            ->assertJsonPath('data.title', "Let's Talk about Beauty")
            ->assertJsonPath('data.sections.eyebrow', 'Helping You Look Good')
            ->assertJsonCount(9, 'data.sections.features')
            ->assertJsonCount(3, 'data.sections.highlights');

        // The /about alias resolves to the same record.
        $this->getJson('/api/pages/about')->assertJsonPath('data.slug', 'about-us');
    }

    public function test_admin_edits_to_about_page_appear_on_storefront(): void
    {
        $this->actingAsAdmin();
        $page = Page::where('slug', 'about-us')->firstOrFail();

        $this->putJson("/api/admin/pages/{$page->id}", [
            'title' => 'Our Story',
            'slug' => 'about-us',
            'subtitle' => 'Organic skincare since day one.',
            'content' => '<p>Updated story.</p>',
            'hero_image_url' => '/storage/uploads/hero.webp',
            'meta_title' => 'About | Dansolam',
            'sections' => [
                'eyebrow' => 'Who we are',
                'features' => ['Body cream', 'Scrub'],
                'highlights' => [['title' => 'Fast delivery', 'text' => 'Nationwide.']],
                'show_faqs' => false,
            ],
        ])->assertOk()->assertJsonPath('success', true);

        $this->getJson('/api/pages/about-us')
            ->assertJsonPath('data.title', 'Our Story')
            ->assertJsonPath('data.subtitle', 'Organic skincare since day one.')
            ->assertJsonPath('data.hero_image_url', '/storage/uploads/hero.webp')
            ->assertJsonPath('data.sections.features', ['Body cream', 'Scrub'])
            ->assertJsonPath('data.sections.show_faqs', false);
    }

    public function test_updating_a_page_without_sections_keeps_existing_sections(): void
    {
        $this->actingAsAdmin();
        $page = Page::where('slug', 'about-us')->firstOrFail();

        $this->putJson("/api/admin/pages/{$page->id}", [
            'title' => $page->title,
            'slug' => 'about-us',
            'content' => '<p>Only the body changed.</p>',
        ])->assertOk();

        $this->assertCount(9, $page->fresh()->sections['features']);
    }

    public function test_page_endpoints_require_authentication(): void
    {
        $page = Page::where('slug', 'about-us')->firstOrFail();

        $this->putJson("/api/admin/pages/{$page->id}", ['title' => 'x', 'slug' => 'about-us', 'content' => 'x'])
            ->assertUnauthorized();
    }

    public function test_migrated_testimonials_are_listed_on_reviews_page(): void
    {
        $this->getJson('/api/reviews')
            ->assertOk()
            ->assertJsonCount(5, 'data.data')
            ->assertJsonPath('data.data.0.product_id', null);
    }

    public function test_admin_can_manage_general_and_product_reviews(): void
    {
        $this->actingAsAdmin();

        // A store-wide testimonial needs no product.
        $created = $this->postJson('/api/admin/reviews', [
            'customer_name' => 'Ada',
            'rating' => 4,
            'comment' => 'Lovely scrub.',
            'is_approved' => false,
        ])->assertSuccessful()->json('data');

        $this->getJson('/api/reviews')->assertJsonCount(5, 'data.data');

        $this->putJson("/api/admin/reviews/{$created['id']}/approve")->assertOk();
        $this->getJson('/api/reviews')->assertJsonCount(6, 'data.data');

        // Editing without is_approved must not un-publish it.
        $this->putJson("/api/admin/reviews/{$created['id']}", [
            'customer_name' => 'Ada O.',
            'rating' => 5,
            'comment' => 'Lovely scrub!',
        ])->assertOk();
        $this->assertTrue(Review::find($created['id'])->is_approved);

        $store = Ecommerce::create(['name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'hi@dansolam.test', 'currency' => 'NGN', 'is_active' => true]);
        $product = Product::create(['ecommerce_id' => $store->id, 'name' => 'Body Cream', 'slug' => 'body-cream', 'sku' => 'BC-1', 'price' => 10, 'status' => 'published']);
        $this->postJson('/api/admin/reviews', [
            'product_id' => $product->id,
            'customer_name' => 'Bola',
            'rating' => 5,
        ])->assertSuccessful();
        $this->getJson("/api/reviews?product_id={$product->id}")->assertJsonCount(1, 'data.data');

        $this->deleteJson("/api/admin/reviews/{$created['id']}")->assertOk();
        $this->assertNull(Review::find($created['id']));
    }

    public function test_flash_sale_product_filter_responds(): void
    {
        Ecommerce::create(['name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'hi@dansolam.test', 'currency' => 'NGN', 'is_active' => true]);

        $this->getJson('/api/products?is_flash_sale=true&limit=6')->assertOk();
    }

    public function test_shop_by_concern_counts_and_filters_real_products(): void
    {
        $store = Ecommerce::first() ?? Ecommerce::create(['name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'hi@dansolam.test', 'currency' => 'NGN', 'is_active' => true]);
        $kids = \App\Models\Category::create(['name' => 'Kids', 'slug' => 'kids']);
        foreach (['Kids Cream', 'Kids Soap'] as $i => $name) {
            $p = Product::create(['ecommerce_id' => $store->id, 'name' => $name, 'slug' => "kids-{$i}", 'sku' => "K-{$i}", 'price' => 5, 'status' => 'published']);
            $p->categories()->attach($kids->id);
        }
        Product::create(['ecommerce_id' => $store->id, 'name' => 'Other', 'slug' => 'other', 'sku' => 'O-1', 'price' => 5, 'status' => 'published']);

        \App\Models\EcommerceSetting::create(['ecommerce_id' => $store->id, 'key' => 'shop_by_concern_items', 'value' => json_encode([
            ['id' => 1, 'name' => 'Sensitive & Kids', 'blurb' => 'Gentle care', 'filter_type' => 'category', 'filter_values' => ['kids']],
            ['id' => 2, 'name' => 'Empty concern', 'filter_type' => 'category', 'filter_values' => []],
        ])]);

        $this->getJson('/api/shop-concerns')
            ->assertOk()
            ->assertJsonCount(1, 'data.items') // empty concerns are hidden
            ->assertJsonPath('data.items.0.count', 2)
            ->assertJsonPath('data.items.0.link', '/shop?concern=sensitive-kids');

        $this->getJson('/api/products?concern=sensitive-kids')->assertJsonPath('data.total', 2);
        $this->getJson('/api/products?concern=unknown')->assertJsonPath('data.total', 0);
    }
}
