<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\Review;
use Illuminate\Database\Seeder;

/**
 * Content migrated from the original dansolam.com site (About + Testimonials).
 * Safe to re-run: pages are upserted by slug and testimonials by comment text.
 */
class StorefrontContentSeeder extends Seeder
{
    public function run(): void
    {
        Page::updateOrCreate(['slug' => 'about-us'], [
            'title' => "Let's Talk about Beauty",
            'subtitle' => 'Helping you look good with 100% organic skincare made for your skin’s unique needs.',
            'hero_image_url' => null,
            'content' => implode('', [
                '<p>Experience the essence of soft beach sand and refreshing sea breeze as you pamper your skin with DANSOLAM Body Cream. Specially formulated to deeply moisturize dry skin, this cream helps unify uneven skin tones and restore your skin’s natural radiance. If you struggle with discoloration, DANSOLAM Cream blends your complexion seamlessly, while also soothing, nourishing, and hydrating your body for a healthy, glowing appearance.</p>',
                '<p>Crafted with 100% organic ingredients, DANSOLAM Cream leaves no side effects—no rashes, bumps, or irritation. It’s designed to give you smooth, hydrated skin without any unwanted reactions. Achieve a balanced, moisturized skin tone with a product that’s safe for your body and face.</p>',
                '<p>At Dansolam, we focus on you and your skin’s unique needs. Many are still discovering the benefits of our 100% organic cream, ideal for addressing uneven skin tone, dark spots, and more. Unlike other brands that push multiple products, we believe in simplicity. Our all-in-one body cream works wonders, and for specific concerns like sunburn or advanced acne, we only recommend a specialized face cream when necessary. Rest assured, all our products are free of harmful side effects.</p>',
            ]),
            'sections' => [
                'eyebrow' => 'Helping You Look Good',
                'image_url' => '/images/about/about-cream.webp',
                'features_heading' => 'Features of our products',
                'features' => [
                    'Whitening Body Lotion',
                    'Body and face scrub',
                    'Children Cream',
                    'Essential Oil',
                    'Ebony',
                    'Whitening and glowing soap',
                    'Glowing moisturizing (Fast selling)',
                    'Sunburn cream',
                    'Face cream',
                ],
                'highlights_heading' => 'Enjoy a great shopping experience at any scale',
                'highlights' => [
                    ['title' => 'Mobile shopping', 'text' => 'Shop for our products from the convenience of your mobile.'],
                    ['title' => 'Secure payments', 'text' => 'Use our fast and secure payment options to make payments.'],
                    ['title' => 'Present packaging', 'text' => 'We can help you package as gifts to be delivered to that loved one.'],
                ],
                'show_faqs' => true,
            ],
            'meta_title' => 'About Us | Dansolam',
            'meta_description' => 'Dansolam makes 100% organic body creams, oils, scrubs and soaps that moisturise, even out skin tone and restore natural radiance — with no side effects.',
        ]);

        $testimonials = [
            ['Good morning, you have turned me to proper Oyinbo pepper. This is my face without any foundation powder, receiving all the lovely comments from work, and people are still asking for your number.', 1],
            ['The oil is good ooo, Amirah love her oil, in fact she no use the aloe vera ooo. Oil is on point. Mix mine for me mama.', 2],
            ['Yes, I got the cream, I love it so much, like I can already see changes. I am not wearing makeup and the cream smells nice. THANKS.', 3],
            ['Thank you so much, I got a cream too, my skin is ready to pop up again.', 4],
            ['The scrub is done, thinking of ordering soon, but my skin is blending out, so happy about that. THANKS.', 5],
        ];

        foreach ($testimonials as [$comment, $n]) {
            Review::updateOrCreate(['comment' => $comment], [
                'product_id' => null,
                'customer_name' => 'Verified Customer',
                'rating' => 5,
                'image_url' => "/images/reviews/testimonial-{$n}.webp",
                'is_approved' => true,
            ]);
        }
    }
}
