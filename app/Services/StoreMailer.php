<?php

namespace App\Services;

use App\Models\EcommerceSetting;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Points Laravel's mailer at the SMTP account saved under Settings → SMTP, so every
 * email the store sends (orders, password resets, newsletters, tests) uses it.
 */
class StoreMailer
{
    /** Seconds to wait on the SMTP server before giving up, so a bad host fails fast. */
    public const TIMEOUT = 15;

    public const KEYS = [
        'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
        'smtp_encryption', 'smtp_from_address', 'smtp_from_name',
    ];

    /**
     * Apply the saved SMTP settings. Returns false when none are saved, leaving the
     * mailer from .env in place.
     */
    public static function apply(): bool
    {
        $settings = EcommerceSetting::query()
            ->whereIn('key', self::KEYS)
            ->pluck('value', 'key')
            ->all();

        return self::use($settings);
    }

    /**
     * Configure the mailer from an array of smtp_* values (saved or submitted).
     */
    public static function use(array $smtp, ?string $fallbackName = null): bool
    {
        if (empty($smtp['smtp_host'])) {
            return false;
        }

        $port = (int) ($smtp['smtp_port'] ?? 0) ?: 587;
        $encryption = strtolower((string) ($smtp['smtp_encryption'] ?? 'tls'));

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => trim($smtp['smtp_host']),
            'mail.mailers.smtp.port' => $port,
            'mail.mailers.smtp.username' => $smtp['smtp_username'] ?? null,
            'mail.mailers.smtp.password' => $smtp['smtp_password'] ?? null,
            // SSL means a TLS connection from the start (smtps). TLS and none use plain
            // smtp, which upgrades with STARTTLS whenever the server offers it.
            'mail.mailers.smtp.scheme' => ($encryption === 'ssl' || $port === 465) ? 'smtps' : 'smtp',
            'mail.mailers.smtp.timeout' => self::TIMEOUT,
            'mail.from.address' => $smtp['smtp_from_address'] ?? config('mail.from.address'),
            'mail.from.name' => $smtp['smtp_from_name'] ?? $fallbackName ?? config('mail.from.name'),
        ]);

        // A mailer built earlier in this request would keep the old connection details.
        if (app()->resolved('mail.manager')) {
            app('mail.manager')->purge('smtp');
        }

        return true;
    }

    /**
     * Send without ever breaking the customer's action: a mail failure is logged,
     * not thrown. Returns whether the message was handed to the mail server.
     */
    public static function send(?string $to, Mailable $mailable): bool
    {
        if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        try {
            Mail::to($to)->send($mailable);
            return true;
        } catch (\Throwable $e) {
            Log::warning('Email to ' . $to . ' failed (' . class_basename($mailable) . '): ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Where store alerts go (new orders, enquiries, bookings): the support email from
     * Settings, else the address the store sends from.
     */
    public static function storeInbox(): ?string
    {
        $settings = EcommerceSetting::whereIn('key', ['admin_notification_email', 'support_email', 'smtp_from_address'])
            ->pluck('value', 'key');

        foreach (['admin_notification_email', 'support_email', 'smtp_from_address'] as $key) {
            if (filter_var($settings[$key] ?? null, FILTER_VALIDATE_EMAIL)) {
                return $settings[$key];
            }
        }

        $from = config('mail.from.address');
        return filter_var($from, FILTER_VALIDATE_EMAIL) && !str_ends_with($from, '@example.com') ? $from : null;
    }

    /** Format an amount in the store currency, e.g. £12.50. */
    public static function money(float|int|string|null $amount): string
    {
        static $symbol;
        $symbol ??= EcommerceSetting::where('key', 'system_currency_symbol')->value('value') ?: '£';

        return $symbol . number_format((float) $amount, 2);
    }

    /** Tell the store a payment has come in for an order. */
    public static function paymentReceived(object $order, string $gateway): bool
    {
        return self::send(self::storeInbox(), new \App\Mail\StoreMessage(
            subjectLine: "Payment received for order #{$order->order_number}: " . self::money($order->total_amount),
            heading: 'Payment received',
            paragraphs: ['This order is paid and ready to be packed.'],
            details: [
                'Order' => '#' . $order->order_number,
                'Amount' => self::money($order->total_amount),
                'Paid with' => ucwords(str_replace('_', ' ', $gateway)),
                'Customer' => trim(($order->customer_name ?? '') . ' · ' . ($order->customer_email ?? ''), ' ·'),
            ],
            buttonText: 'Open order',
            buttonUrl: url('/admin/orders/' . $order->id),
        ));
    }
}
