<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Banner;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        // Remove existing hero banners
        Banner::where('type', 'hero')->delete();

        $slides = [
            [
                'title' => 'Pure botanical bath indulgence for',
                'accent_title' => 'silken radiant skin.',
                'eyebrow' => 'Luxury Bathing & Herbal Polish Soaps',
                'subtitle' => 'Handcrafted organic whitening soaps, foaming botanical cleansers, and herbal bath polishes that gently wash away impurities and reveal deep, radiant luminosity.',
                'image_url' => '/images/hero/bathing_soaps.jpg',
                'link_url' => '/shop',
                'primary_cta_label' => 'Shop Bathing & Soaps',
                'secondary_cta_label' => 'Explore Glow Rituals',
                'secondary_cta_url' => '/pages/tips',
                'top_kicker' => '100% Herbal',
                'top_text' => 'Cold-Pressed Extracts',
                'bottom_kicker' => 'Whitening Polish Soap',
                'bottom_text' => 'Signature Bath Bar',
                'type' => 'hero',
                'layout_mode' => 'default',
                'is_active' => true,
                'sort_order' => 0,
            ],
            [
                'title' => 'Rich restorative creaming for',
                'accent_title' => 'lasting moisture & tone.',
                'eyebrow' => 'Daily Creaming & Skin Nourishment',
                'subtitle' => 'Silky whipped botanical body creams, Molato brightening butters, and discoloration oils crafted to wrap your skin in 24h velvety hydration and flawless tone.',
                'image_url' => '/images/hero/creaming_radiance.jpg',
                'link_url' => '/shop',
                'primary_cta_label' => 'Shop Creams & Butters',
                'secondary_cta_label' => 'View Routine Tips',
                'secondary_cta_url' => '/pages/tips',
                'top_kicker' => '4.9★',
                'top_text' => '2,850+ Verified Reviews',
                'bottom_kicker' => 'Molato Radiant Cream',
                'bottom_text' => 'Bestselling Moisturizer',
                'type' => 'hero',
                'layout_mode' => 'default',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'title' => 'Exquisite lingering fragrances that',
                'accent_title' => 'leave an unforgettable aura.',
                'eyebrow' => 'Signature Scents & Luxury Perfumes',
                'subtitle' => 'Artisan body mists, concentrated perfume oils, and intoxicating botanical essences formulated to keep you smelling delightfully fresh, elegant, and captivating all day.',
                'image_url' => '/images/hero/perfumes_fragrance.jpg',
                'link_url' => '/shop',
                'primary_cta_label' => 'Explore Perfumes & Scents',
                'secondary_cta_label' => 'Discover All Scents',
                'secondary_cta_url' => '/shop',
                'top_kicker' => '24h Sillage',
                'top_text' => 'Pure Essential Concentrates',
                'bottom_kicker' => 'Golden Amber Mist',
                'bottom_text' => 'Signature Perfume',
                'type' => 'hero',
                'layout_mode' => 'default',
                'is_active' => true,
                'sort_order' => 2,
            ],
        ];

        foreach ($slides as $slide) {
            Banner::create($slide);
        }
    }
}
