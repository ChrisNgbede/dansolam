<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('category_collection', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Get first ecommerce id
        $ecommerceId = DB::table('ecommerces')->value('id');
        if (!$ecommerceId) {
            $ecommerceId = DB::table('ecommerces')->insertGetId([
                'name' => 'Dansolam',
                'slug' => 'dansolam-collections',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }


        // Seed Collections to match the current mega menu content structure
        $collectionsData = [
            [
                'name' => 'Clothing Wear',
                'slug' => 'clothing-wear',
                'description' => 'Elegant designer clothing, jumpsuits, and sets.',
                'banner_url' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=350',
                'is_published' => true,
            ],
            [
                'name' => 'Handbags & Wallets',
                'slug' => 'handbags-wallets',
                'description' => 'Luxury designer clutches and wallets.',
                'banner_url' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=350',
                'is_published' => true,
            ],
            [
                'name' => 'Shoes & Footwear',
                'slug' => 'shoes-footwear',
                'description' => 'Corporate office heels and party sandals.',
                'banner_url' => 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=350',
                'is_published' => true,
            ],
        ];

        $collectionIds = [];
        foreach ($collectionsData as $col) {
            // Check if collection already exists
            $existingId = DB::table('collections')->where('slug', $col['slug'])->value('id');
            if ($existingId) {
                DB::table('collections')->where('id', $existingId)->update($col);
                $collectionIds[$col['slug']] = $existingId;
            } else {
                $insertedId = DB::table('collections')->insertGetId(array_merge($col, [
                    'created_at' => now(),
                    'updated_at' => now()
                ]));
                $collectionIds[$col['slug']] = $insertedId;
            }
        }

        // Link Categories to Collections
        $links = [
            'clothing-wear' => ['corporate-wear', 'jumpsuits', 'evening-wear', 'dresses'],
            'handbags-wallets' => ['handbags'],
            'shoes-footwear' => ['shoes-sneakers', 'accessories'],
        ];

        foreach ($links as $colSlug => $catSlugs) {
            $colId = $collectionIds[$colSlug] ?? null;
            if (!$colId) continue;

            $catIds = DB::table('categories')->whereIn('slug', $catSlugs)->pluck('id');
            foreach ($catIds as $catId) {
                // Avoid duplicate insert
                $exists = DB::table('category_collection')
                    ->where('category_id', $catId)
                    ->where('collection_id', $colId)
                    ->exists();

                if (!$exists) {
                    DB::table('category_collection')->insert([
                        'category_id' => $catId,
                        'collection_id' => $colId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Seed default mega menu ads URLs into ecommerce_settings
        $defaultAds = [
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=350',
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=350',
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=350',
        ];

        $settingExists = DB::table('ecommerce_settings')
            ->where('ecommerce_id', $ecommerceId)
            ->where('key', 'mega_menu_ads')
            ->exists();

        if (!$settingExists) {
            DB::table('ecommerce_settings')->insert([
                'ecommerce_id' => $ecommerceId,
                'key' => 'mega_menu_ads',
                'value' => json_encode($defaultAds),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_collection');
    }
};
