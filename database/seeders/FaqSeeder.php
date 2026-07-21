<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            ['question' => 'How do I choose the correct size?', 'answer' => 'Use our Size Guide to compare your bust, waist and hip measurements with our UK sizing. If you are between sizes, contact our WhatsApp concierge before ordering and we will recommend the best fit.', 'sort_order' => 10],
            ['question' => 'Do you deliver outside Abuja?', 'answer' => 'Yes. We offer local delivery within Abuja, nationwide delivery across Nigeria and international delivery to supported destinations. Available rates and estimated delivery times appear during checkout.', 'sort_order' => 20],
            ['question' => 'How long will my order take to arrive?', 'answer' => 'Abuja deliveries typically arrive within 1–2 business days, nationwide deliveries within 3–5 business days and international deliveries within 7–10 business days. Bespoke or altered pieces may require additional preparation time.', 'sort_order' => 30],
            ['question' => 'Which payment methods do you accept?', 'answer' => 'Available payment methods are displayed securely at checkout and may include Paystack card or transfer payments, bank transfer and other methods enabled by the ecommerce.', 'sort_order' => 40],
            ['question' => 'Can I exchange an item if the size is not right?', 'answer' => 'Eligible unworn items may be exchanged or returned for store credit within 7 days of delivery. Items must retain their original tags and packaging. Bespoke, altered and final-sale pieces are not eligible unless faulty.', 'sort_order' => 50],
            ['question' => 'Can I order an item that is currently out of stock?', 'answer' => 'Some pieces may be available for preorder or approved overselling. Where available, the product page will allow you to continue and our team will confirm the expected fulfilment date after your order is received.', 'sort_order' => 60],
            ['question' => 'Do you offer custom fittings or alterations?', 'answer' => 'Yes. Private fittings and alterations are available through our Abuja showroom for selected pieces. Contact our WhatsApp concierge to discuss your measurements and book an appointment.', 'sort_order' => 70],
            ['question' => 'How can I track or change an existing order?', 'answer' => 'Use the Track Order page with your order reference and contact details. If you need to change an address, size or delivery instruction, contact us immediately before the order is dispatched.', 'sort_order' => 80],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(['question' => $faq['question']], $faq);
        }
    }
}
