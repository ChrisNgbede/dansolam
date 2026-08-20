<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            ['question' => 'Are Dansolam products 100% organic and chemical-free?', 'answer' => 'Yes! Every Dansolam product is formulated with 100% natural organic herbs, botanical extracts, almond oil, and essential oils designed to nourish and revitalize your skin safely without hydroquinone, steroids, or harsh chemicals. Looking Good Is Our Pride!', 'sort_order' => 10],
            ['question' => 'How quickly will I notice results with Whitening Polish Soap & Creams?', 'answer' => 'Most customers report visibly smoother, brighter, and more radiant skin within 5 days of consistent daily application. For deep discolouration, sunburn, or dark spots, combine Dansolam Plus (Molato) with Glowing Moisturizing Cream for best results.', 'sort_order' => 20],
            ['question' => 'Do you deliver nationwide and internationally?', 'answer' => 'Yes! We deliver nationwide (1–2 days for local express, 3–5 days standard nationwide) and ship internationally worldwide via DHL Express (7–10 days). Shipping options are calculated automatically at checkout.', 'sort_order' => 30],
            ['question' => 'Which payment methods do you accept?', 'answer' => 'We accept secure online debit/credit card payments via Paystack, direct bank transfers, and Cash on Delivery (COD) for eligible local orders.', 'sort_order' => 40],
            ['question' => 'Can I use Dansolam products on sensitive skin or for children?', 'answer' => 'Yes. We have dedicated gentle formulations such as Children Cream, Ebony Cream, and Essential Oil specifically crafted for delicate, sensitive skin and young complexions.', 'sort_order' => 50],
            ['question' => 'How should I store my organic skincare products?', 'answer' => 'Store all Dansolam organic creams, soaps, oils, and body scrubs in a cool, dry place out of direct sunlight. Ensure lids are tightly closed after each use to maintain botanical freshness.', 'sort_order' => 60],
            ['question' => 'How do I perform a patch test before first use?', 'answer' => 'Dab a small amount of product onto your inner arm or behind your ear and leave it for 24 hours. If no redness or irritation occurs, the product is safe for full facial and body application.', 'sort_order' => 70],
            ['question' => 'How can I track my order status?', 'answer' => 'Enter your order ID on our Track Order page or click the floating WhatsApp button to chat directly with our customer agent team for instant real-time updates.', 'sort_order' => 80],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(['question' => $faq['question']], $faq);
        }
    }
}
