<?php

namespace Tests\Feature;

use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $ecommerce = Ecommerce::create([
            'name' => 'Dansolam Beauty Home',
            'slug' => 'dansolam-beauty-home',
            'domain' => 'dansolam.test',
            'email' => 'sales@dansolam.com',
            'currency' => 'USD',
            'is_active' => true,
        ]);

        EcommerceSetting::create(['ecommerce_id' => $ecommerce->id, 'key' => 'storefront_theme_mode', 'value' => 'light']);

        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
