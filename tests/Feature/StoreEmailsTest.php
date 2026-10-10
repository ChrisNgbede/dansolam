<?php

namespace Tests\Feature;

use App\Mail\OrderInvoiceMail;
use App\Mail\StoreMessage;
use App\Models\Customer;
use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\FittingSession;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\StoreMailer;
use Database\Seeders\ShippingRulesSeeder;
use App\Models\ShippingRate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Every email the store is expected to send, to the right person.
 */
class StoreEmailsTest extends TestCase
{
    use RefreshDatabase;

    private const STORE_INBOX = 'info@dansolam.com';

    private Ecommerce $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Ecommerce::first() ?? Ecommerce::create([
            'name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'info@dansolam.com', 'currency' => 'GBP', 'is_active' => true,
        ]);
        foreach (['support_email' => self::STORE_INBOX, 'system_currency_symbol' => '£'] as $key => $value) {
            EcommerceSetting::updateOrCreate(['ecommerce_id' => $this->store->id, 'key' => $key], ['value' => $value]);
        }

        Mail::fake();
    }

    private function sentTo(string $email, string $subjectContains): void
    {
        Mail::assertSent(StoreMessage::class, fn (StoreMessage $m) => $m->hasTo($email) && str_contains($m->subjectLine, $subjectContains));
    }

    public function test_customer_password_reset_sends_a_code(): void
    {
        Customer::create(['name' => 'Jane Doe', 'email' => 'jane@example.com', 'password' => bcrypt('secret123')]);

        $this->postJson('/api/customer/forgot-password', ['email' => 'jane@example.com'])->assertOk();

        $code = DB::table('password_reset_tokens')->where('email', 'jane@example.com')->value('token');
        $this->assertNotNull($code);
        Mail::assertSent(StoreMessage::class, fn (StoreMessage $m) => $m->hasTo('jane@example.com')
            && $m->code === $code && str_contains($m->buttonUrl, 'reset-password') && str_contains($m->render(), $code));
    }

    public function test_admin_password_reset_sends_a_code(): void
    {
        User::factory()->create(['email' => 'owner@dansolam.com']);

        $this->postJson('/api/admin/forgot-password', ['email' => 'owner@dansolam.com'])->assertOk();

        $code = DB::table('password_reset_tokens')->where('email', 'owner@dansolam.com')->value('token');
        Mail::assertSent(StoreMessage::class, fn (StoreMessage $m) => $m->hasTo('owner@dansolam.com') && $m->code === $code);
    }

    public function test_unknown_email_gets_the_same_answer_but_no_mail(): void
    {
        $this->postJson('/api/customer/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk()->assertJson(['success' => true]);

        Mail::assertNothingSent();
    }

    public function test_password_change_is_confirmed_by_email(): void
    {
        Customer::create(['name' => 'Jane Doe', 'email' => 'jane@example.com', 'password' => bcrypt('secret123')]);
        DB::table('password_reset_tokens')->insert(['email' => 'jane@example.com', 'token' => '123456', 'created_at' => now()]);

        $this->postJson('/api/customer/reset-password', [
            'email' => 'jane@example.com', 'token' => '123456', 'password' => 'newpass123', 'password_confirmation' => 'newpass123',
        ])->assertOk();

        $this->sentTo('jane@example.com', 'password was changed');
    }

    public function test_new_customers_get_a_welcome_email(): void
    {
        $this->postJson('/api/customer/register', [
            'name' => 'Ada Obi', 'email' => 'ada@example.com', 'password' => 'secret123', 'password_confirmation' => 'secret123',
        ])->assertCreated();

        $this->sentTo('ada@example.com', 'Welcome');
    }

    public function test_newsletter_signup_is_confirmed_once(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'fan@example.com'])->assertOk();
        $this->postJson('/api/newsletter/subscribe', ['email' => 'fan@example.com'])->assertOk();

        Mail::assertSent(StoreMessage::class, 1);
        $this->sentTo('fan@example.com', 'subscribed');
    }

    public function test_contact_form_acknowledges_sender_and_alerts_store(): void
    {
        $this->postJson('/api/contact-inquiries', [
            'name' => 'Grace A', 'email' => 'grace@example.com', 'subject' => 'Bulk order', 'message' => 'Do you offer wholesale prices?',
        ])->assertOk();

        $this->sentTo('grace@example.com', 'We received your message');
        Mail::assertSent(StoreMessage::class, fn (StoreMessage $m) => $m->hasTo(self::STORE_INBOX)
            && str_contains($m->subjectLine, 'Bulk order') && $m->replyToAddress === 'grace@example.com');
    }

    public function test_consultation_booking_confirms_and_alerts_store(): void
    {
        $this->postJson('/api/fitting-sessions', [
            'name' => 'Tola B', 'email' => 'tola@example.com', 'phone' => '07700900000',
            'preferred_date' => now()->addDays(3)->toDateString(), 'preferred_time' => '11:00',
        ])->assertCreated();

        $this->sentTo('tola@example.com', 'consultation request');
        $this->sentTo(self::STORE_INBOX, 'New consultation request');
    }

    public function test_customer_hears_when_consultation_is_confirmed(): void
    {
        $session = FittingSession::create([
            'ecommerce_id' => $this->store->id, 'name' => 'Tola B', 'email' => 'tola@example.com', 'phone' => '0770',
            'preferred_date' => now()->addDays(3)->toDateString(), 'preferred_time' => '11:00', 'status' => 'pending',
        ]);
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/admin/fitting-sessions/{$session->id}", ['status' => 'approved', 'admin_notes' => 'internal: VIP'])->assertOk();
        $this->putJson("/api/admin/fitting-sessions/{$session->id}", ['status' => 'approved'])->assertOk();

        Mail::assertSent(StoreMessage::class, 1);
        Mail::assertSent(StoreMessage::class, fn (StoreMessage $m) => $m->hasTo('tola@example.com')
            && str_contains($m->subjectLine, 'confirmed') && !str_contains(implode(' ', $m->paragraphs), 'internal'));
    }

    public function test_checkout_emails_customer_and_store(): void
    {
        $this->seed(ShippingRulesSeeder::class);
        $product = Product::create([
            'ecommerce_id' => $this->store->id, 'name' => 'Body Cream', 'slug' => 'body-cream', 'sku' => 'BC-1',
            'price' => 20, 'stock_quantity' => 50, 'status' => 'published', 'has_variants' => false,
        ]);

        $this->postJson('/api/checkout', [
            'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'customer_phone' => '+447700900000',
            'delivery_address' => '1 High Street', 'delivery_city' => 'London', 'delivery_state' => 'London',
            'delivery_country' => 'United Kingdom', 'payment_method' => 'bank_transfer',
            'shipping_rate_id' => ShippingRate::where('name', 'Uk Shipping (1-3 Items)')->value('id'),
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertOk();

        $order = Order::latest('id')->first();
        Mail::assertSent(OrderInvoiceMail::class, fn ($m) => $m->hasTo('jane@example.com') && $m->templateType === 'order_placed');
        Mail::assertSent(StoreMessage::class, fn (StoreMessage $m) => $m->hasTo(self::STORE_INBOX)
            && $m->subjectLine === "New order #{$order->order_number}: £46.00"
            && str_contains($m->details['Items'], '2 × Body Cream'));
    }

    public function test_order_emails_use_the_store_currency(): void
    {
        $order = new Order(['order_number' => 'DS-1', 'customer_name' => 'Jane', 'total_amount' => 46, 'subtotal' => 40,
            'delivery_fee' => 6, 'payment_method' => 'paypal', 'payment_status' => 'paid', 'order_status' => 'paid', 'delivery_method' => 'delivery']);
        $html = (new OrderInvoiceMail($order, 'payment_success'))->render();

        $this->assertStringContainsString('£46.00', $html);
        $this->assertStringNotContainsString('₦', $html);
    }

    public function test_store_alerts_fall_back_to_the_sending_address(): void
    {
        EcommerceSetting::where('key', 'support_email')->update(['value' => null]);
        config(['mail.from.address' => 'hello@example.com']);
        $this->assertNull(StoreMailer::storeInbox());

        config(['mail.from.address' => 'info@dansolam.com']);
        $this->assertSame('info@dansolam.com', StoreMailer::storeInbox());
    }

    public function test_a_mail_failure_never_breaks_the_customer_action(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $this->postJson('/api/newsletter/subscribe', ['email' => 'fan@example.com'])->assertOk();
        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'fan@example.com']);
    }
}
