<?php

namespace Tests\Feature;

use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use App\Models\User;
use App\Services\StoreMailer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Saving the SMTP tab, and that saved SMTP details are what the store sends with.
 */
class SmtpSettingsTest extends TestCase
{
    use RefreshDatabase;

    private Ecommerce $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Ecommerce::first() ?? Ecommerce::create([
            'name' => 'Dansolam', 'slug' => 'dansolam', 'email' => 'info@dansolam.com', 'currency' => 'GBP', 'is_active' => true,
        ]);
        Sanctum::actingAs(User::factory()->create());
    }

    private function smtp(array $overrides = []): array
    {
        return array_merge([
            'smtp_host' => 'mail.dansolam.com',
            'smtp_port' => '465',
            'smtp_username' => 'info@dansolam.com',
            'smtp_password' => 'Xy7$#!pa;ss&word=1',
            'smtp_encryption' => 'ssl',
            'smtp_from_address' => 'info@dansolam.com',
            'smtp_from_name' => 'Dansolam',
        ], $overrides);
    }

    private function setting(string $key): ?string
    {
        return EcommerceSetting::where('ecommerce_id', $this->store->id)->where('key', $key)->value('value');
    }

    public function test_smtp_settings_save(): void
    {
        $this->putJson('/api/admin/settings', $this->smtp() + ['sku_prefix' => 'DAN-'])
            ->assertOk()->assertJson(['success' => true]);

        $this->assertSame('mail.dansolam.com', $this->setting('smtp_host'));
        $this->assertSame('Xy7$#!pa;ss&word=1', $this->setting('smtp_password'));
        $this->assertSame('ssl', $this->setting('smtp_encryption'));
    }

    public function test_saving_unchanged_settings_writes_nothing(): void
    {
        $this->putJson('/api/admin/settings', $this->smtp())->assertOk();

        DB::enableQueryLog();
        $this->putJson('/api/admin/settings', $this->smtp())->assertOk();
        $writes = collect(DB::getQueryLog())->filter(fn ($q) => preg_match('/^(insert|update)/i', $q['query']) && str_contains($q['query'], 'ecommerce_settings'));

        $this->assertCount(0, $writes);
    }

    public function test_only_changed_settings_are_updated(): void
    {
        $this->putJson('/api/admin/settings', $this->smtp())->assertOk();
        $this->putJson('/api/admin/settings', $this->smtp(['smtp_port' => '587', 'smtp_encryption' => 'tls']))->assertOk();

        $this->assertSame('587', $this->setting('smtp_port'));
        $this->assertSame('tls', $this->setting('smtp_encryption'));
        $this->assertSame('mail.dansolam.com', $this->setting('smtp_host'));
    }

    public function test_saved_smtp_is_used_for_store_mail(): void
    {
        $this->putJson('/api/admin/settings', $this->smtp())->assertOk();

        config(['mail.default' => 'log']);
        $this->assertTrue(StoreMailer::apply());

        $this->assertSame('smtp', config('mail.default'));
        $this->assertSame('mail.dansolam.com', config('mail.mailers.smtp.host'));
        $this->assertSame(465, config('mail.mailers.smtp.port'));
        $this->assertSame('smtps', config('mail.mailers.smtp.scheme'));
        $this->assertSame(StoreMailer::TIMEOUT, config('mail.mailers.smtp.timeout'));
        $this->assertSame('info@dansolam.com', config('mail.from.address'));
    }

    public function test_tls_on_587_uses_starttls(): void
    {
        StoreMailer::use($this->smtp(['smtp_port' => '587', 'smtp_encryption' => 'tls']));

        $this->assertSame('smtp', config('mail.mailers.smtp.scheme'));
        $this->assertSame(587, config('mail.mailers.smtp.port'));
    }

    public function test_without_saved_smtp_the_env_mailer_is_kept(): void
    {
        config(['mail.default' => 'log']);

        $this->assertFalse(StoreMailer::apply());
        $this->assertSame('log', config('mail.default'));
    }

    public function test_a_mailer_built_before_saving_picks_up_the_new_details(): void
    {
        StoreMailer::use($this->smtp(['smtp_host' => 'old.example.com']));
        $first = Mail::mailer('smtp');

        StoreMailer::use($this->smtp(['smtp_host' => 'new.example.com']));
        $this->assertNotSame($first, Mail::mailer('smtp'));
    }

    public function test_smtp_test_requires_a_recipient(): void
    {
        $this->postJson('/api/admin/settings/test-smtp', $this->smtp())
            ->assertStatus(422)->assertJsonValidationErrors('recipient_email');
    }

    public function test_smtp_test_reports_an_unreachable_host_clearly(): void
    {
        $started = microtime(true);

        $this->postJson('/api/admin/settings/test-smtp', $this->smtp([
            'smtp_host' => '127.0.0.1', 'smtp_port' => 1, 'smtp_encryption' => 'tls', 'recipient_email' => 'owner@example.com',
        ]))->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'Check the SMTP host name and port'));

        $this->assertLessThan(StoreMailer::TIMEOUT + 5, microtime(true) - $started);
    }
}
