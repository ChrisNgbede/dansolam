<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use Illuminate\Support\Str;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Blog Categories
        $categoriesData = [
            ['name' => 'Routine Guides', 'slug' => 'routine-guides'],
            ['name' => 'Editorial', 'slug' => 'editorial'],
            ['name' => 'SHOP Tips', 'slug' => 'shop-tips'],
            ['name' => 'Skincare Formulations', 'slug' => 'skincare-formulations'],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = BlogCategory::firstOrCreate(
                ['slug' => $cat['slug']],
                ['name' => $cat['name']]
            );
        }

        // 2. Seed Blog Tags
        $tagsData = [
            'Hyperpigmentation',
            'Organic Botanicals',
            'Glow Routine',
            'Storage Care',
            'Hydroquinone-Free',
            'Sunscreen SPF 50',
            'Whitening Polish Soap',
            'Facial Care',
        ];

        $tags = [];
        foreach ($tagsData as $tagName) {
            $slug = Str::slug($tagName);
            $tags[$slug] = BlogTag::firstOrCreate(
                ['slug' => $slug],
                ['name' => $tagName]
            );
        }

        // 3. Seed Articles
        $articles = [
            [
                'title' => 'The 5-Day Glow Routine for Hyperpigmentation',
                'slug' => 'the-5-day-glow-routine-for-hyperpigmentation',
                'category_slug' => 'routine-guides',
                'image_path' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000',
                'status' => 'published',
                'meta_title' => 'The 5-Day Glow Routine for Hyperpigmentation | Dansolam',
                'meta_description' => 'How to combine whitening polish soaps with cold-pressed almond oil for rapid hyperpigmentation results.',
                'tags' => ['hyperpigmentation', 'glow-routine', 'whitening-polish-soap'],
                'content' => '
<p class="lead">Achieving an even, radiant complexion does not require harsh chemical peels or aggressive bleaching agents. With the right botanical synergy, hyperpigmentation and sun damage can be gently lifted while replenishing the lipid moisture barrier.</p>

<h3>Day 1 & 2: Cellular Polish & Dead Cell Removal</h3>
<p>Begin your morning shower with <strong>Dansolam Whitening Polish Soap</strong>. Massage the herbal lather into dark knuckles, elbows, knees, and pigmented areas. Allow the organic botanicals to sit on the skin for 2 to 3 minutes before rinsing with lukewarm water.</p>
<p>Pat your skin lightly with a microfiber towel—leaving a light film of moisture—and immediately smooth on our cold-pressed <strong>Discoloration Body Oil</strong>. The sweet almond oil base delivers deep vitamin E to accelerate natural skin turnover.</p>

<h3>Day 3 & 4: Deep Moisture Seal & Active Repair</h3>
<p>In the evenings, layer <strong>Glowing Moisturizing Cream</strong> over the oil. The cold-pressed shea and herbal brightening extracts work overnight while cellular repair peaks.</p>

<h3>Day 5: Unveiling Luminous Skin Tone</h3>
<p>By day five, dead surface melanin has shed naturally, revealing a visibly brighter, softer, and more even skin tone. Always finish your morning routine with broad-spectrum mineral SPF 50 to lock in your glow and prevent new sunspots.</p>
',
            ],
            [
                'title' => 'Why Hydroquinone-Free Skincare is the Safest Choice',
                'slug' => 'why-hydroquinone-free-skincare-is-the-safest-choice',
                'category_slug' => 'editorial',
                'image_path' => 'https://images.unsplash.com/photo-1512290900672-1f5be4df1d3a?q=80&w=1000',
                'status' => 'published',
                'meta_title' => 'Why Hydroquinone-Free Skincare is the Safest Choice | Dansolam',
                'meta_description' => 'The science of organic herbal extracts, botanical brightening, and long-term skin health without harsh hydroquinone.',
                'tags' => ['hydroquinone-free', 'organic-botanicals', 'skincare-formulations'],
                'content' => '
<p class="lead">For decades, commercial skin-brightening products relied on aggressive synthetic chemicals like hydroquinone, mercury, and harsh steroids. While they may produce rapid lightening, the long-term consequences—such as ochronosis, permanent thinning of the dermal layer, and rebound pigmentation—are devastating.</p>

<h3>The Dansolam Botanical Philosophy</h3>
<p>At Dansolam Beauty Home, our formulations are strictly <strong>100% hydroquinone-free and steroid-free</strong>. We harness safe, clinically validated plant extracts:</p>
<ul>
  <li><strong>Alpha-Arbutin & Bearberry Extract:</strong> Naturally inhibits tyrosinase enzymes to slow excess melanin synthesis without damaging healthy melanocytes.</li>
  <li><strong>Licorice Root & Mulberry Extract:</strong> Potent antioxidants that fade stubborn dark spots and calm post-inflammatory erythema.</li>
  <li><strong>Cold-Pressed Herbal Oils:</strong> Nourish the skin barrier with essential fatty acids, restoring elasticity and a natural youthful radiance.</li>
</ul>

<p>When you choose organic, botanical skincare, you invest in luminous, healthy skin that radiates confidence for a lifetime.</p>
',
            ],
            [
                'title' => 'Preserving Botanical Potency: Product Storage & Care',
                'slug' => 'preserving-botanical-potency-product-storage-care',
                'category_slug' => 'shop-tips',
                'image_path' => 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000',
                'status' => 'published',
                'meta_title' => 'Preserving Botanical Potency: Product Storage & Care | Dansolam',
                'meta_description' => 'Essential tips on keeping your natural creams and scrubs fresh and active in warm weather.',
                'tags' => ['storage-care', 'organic-botanicals'],
                'content' => '
<p class="lead">Because Dansolam formulations are enriched with fresh plant extracts, cold-pressed seed oils, and natural actives, proper storage is essential to preserve their peak antioxidant potency.</p>

<h3>1. Avoid Direct Sunlight & Heat</h3>
<p>UV light and elevated temperatures can accelerate the breakdown of delicate botanical actives like Vitamin C, Rosehip, and Almond oils. Keep your creams, scrubs, and serums in a cool, shaded vanity or bathroom cabinet away from window sills.</p>

<h3>2. Keep Water Out of Body Scrub Jars</h3>
<p>When using herbal polishes and body scrubs in the shower, always scoop with dry hands or a clean cosmetic spatula. Introducing water into jars can dilute the natural formulation and reduce shelf life.</p>

<h3>3. Seal Caps Tightly After Every Use</h3>
<p>Exposure to open air causes oxidation. Ensure all pump dispensers and jar lids are securely fastened immediately after application.</p>
',
            ],
            [
                'title' => 'The Art of Facial Steaming & Hydro-Glow Exfoliation',
                'slug' => 'the-art-of-facial-steaming-hydro-glow-exfoliation',
                'category_slug' => 'shop-tips',
                'image_path' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000',
                'status' => 'published',
                'meta_title' => 'The Art of Facial Steaming & Hydro-Glow Exfoliation | Dansolam',
                'meta_description' => 'How aesthetic steaming detoxifies pores, clears blackheads, and locks in moisture.',
                'tags' => ['facial-care', 'glow-routine'],
                'content' => '
<p class="lead">Aesthetic steaming is one of the foundational treatments at our flagship shop. When warm, micro-fine botanical steam envelopes the skin, pores gently soften, facilitating effortless extraction of trapped sebum and environmental pollutants.</p>

<p>Following steam therapy with our <strong>Glowing & Spot Remover Face Cream</strong> ensures active herbal hydrators penetrate deeply into the epidermis, leaving your complexion refined, plump, and deeply hydrated.</p>
',
            ],
            [
                'title' => 'Sun Protection for Melanin-Rich Skin: Why Mineral SPF Matters',
                'slug' => 'sun-protection-for-melanin-rich-skin-why-mineral-spf-matters',
                'category_slug' => 'routine-guides',
                'image_path' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000',
                'status' => 'published',
                'meta_title' => 'Sun Protection for Melanin-Rich Skin | Dansolam',
                'meta_description' => 'Debunking the myth that dark complexions do not need daily sunscreen protection against UV spots.',
                'tags' => ['sunscreen-spf-50', 'hyperpigmentation'],
                'content' => '
<p class="lead">A common misconception is that melanin provides complete immunity from ultraviolet radiation. In reality, UVA rays penetrate deeply into the dermis, stimulating melanocytes to produce stubborn, uneven pigmentation and dark patches.</p>

<p>Applying a broad-spectrum <strong>SPF 50 mineral sunscreen</strong> every morning shields your skin from photo-aging, preserves your botanical lightening progress, and guarantees an even tone throughout the year.</p>
',
            ],
        ];

        foreach ($articles as $artData) {
            $catId = isset($categories[$artData['category_slug']]) ? $categories[$artData['category_slug']]->id : null;

            $article = Article::updateOrCreate(
                ['slug' => $artData['slug']],
                [
                    'title' => $artData['title'],
                    'content' => $artData['content'],
                    'image_path' => $artData['image_path'],
                    'status' => $artData['status'],
                    'meta_title' => $artData['meta_title'],
                    'meta_description' => $artData['meta_description'],
                    'blog_category_id' => $catId,
                ]
            );

            // Sync tags
            if (!empty($artData['tags'])) {
                $tagIds = [];
                foreach ($artData['tags'] as $tagSlug) {
                    if (isset($tags[$tagSlug])) {
                        $tagIds[] = $tags[$tagSlug]->id;
                    }
                }
                $article->tags()->sync($tagIds);
            }
        }
    }
}
