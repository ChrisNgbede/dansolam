<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\EcommerceSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;

class OrderInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public object $order;
    public string $templateType; // invoice, order_placed, order_shipped
    public ?string $pdfPath;

    /**
     * Create a new message instance.
     */
    public function __construct(object $order, string $templateType = 'invoice', ?string $pdfPath = null)
    {
        $this->order = $order;
        $this->templateType = $templateType;
        $this->pdfPath = $pdfPath;

        $ecommerceId = $order->ecommerce_id ?? 1;

        // Dynamically configure SMTP from settings table
        self::configureMail($ecommerceId);
    }

    /**
     * Configure Laravel Mailer dynamically using ecommerce settings records.
     */
    public static function configureMail(int $ecommerceId): void
    {
        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerceId)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        if (!empty($settings['smtp_host'])) {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $settings['smtp_host'],
                'mail.mailers.smtp.port' => (int)($settings['smtp_port'] ?? 587),
                'mail.mailers.smtp.username' => $settings['smtp_username'] ?? '',
                'mail.mailers.smtp.password' => $settings['smtp_password'] ?? '',
                'mail.mailers.smtp.encryption' => $settings['smtp_encryption'] ?? 'tls',
                'mail.from.address' => $settings['smtp_from_address'] ?? 'noreply@fairqueen.com',
                'mail.from.name' => $settings['smtp_from_name'] ?? 'FairQueen Collections',
            ]);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $ecommerceId = $this->order->ecommerce_id ?? 1;
        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerceId)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        // Subject default vs custom template subjects
        $subject = "Order #{$this->order->order_number} Invoice";
        if ($this->templateType === 'order_placed') {
            $subject = $settings['email_order_placed_subject'] ?? "Thank you for shopping at FairQueen Collections!";
        } elseif ($this->templateType === 'order_shipped') {
            $subject = $settings['email_order_shipped_subject'] ?? "Your order #{$this->order->order_number} is on the way!";
        } elseif ($this->templateType === 'invoice') {
            $subject = $settings['email_invoice_subject'] ?? "Invoice & Receipt for Order #{$this->order->order_number}";
        }

        // Replace placeholders in subject
        $subject = $this->replacePlaceholders($subject);

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Fetch templates from database settings
        $ecommerceId = $this->order->ecommerce_id ?? 1;
        $settingsRaw = EcommerceSetting::where('ecommerce_id', $ecommerceId)->get();
        $settings = [];
        foreach ($settingsRaw as $s) {
            $settings[$s->key] = $s->value;
        }

        $bodyTemplate = '';
        if ($this->templateType === 'order_placed') {
            $bodyTemplate = $settings['email_order_placed_body'] ?? "Hello {customer_name},\n\nWe have received your order #{order_number} for total {total_amount}. We will start packing it shortly.\n\nThank you,\nFairQueen Collections";
        } elseif ($this->templateType === 'order_shipped') {
            $bodyTemplate = $settings['email_order_shipped_body'] ?? "Hello {customer_name},\n\nGood news! Your order #{order_number} has been shipped via home delivery. Feel free to track it under our portal.\n\nThank you,\nFairQueen Collections";
        } else {
            $bodyTemplate = $settings['email_invoice_body'] ?? "Hello {customer_name},\n\nPlease find attached the official invoice/receipt for your order #{order_number} of total {total_amount}.\n\nThank you for shopping with us,\nFairQueen Collections";
        }

        $bodyText = $this->replacePlaceholders($bodyTemplate);

        return new Content(
            view: 'emails.order-notification',
            with: [
                'bodyText' => nl2br($bodyText),
                'order' => $this->order,
                'themeColor' => $settings['theme_primary_color'] ?? '#C5A880'
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];
        if ($this->pdfPath && file_exists($this->pdfPath)) {
            $attachments[] = Attachment::fromPath($this->pdfPath)
                ->as("Invoice-{$this->order->order_number}.pdf")
                ->withMime('application/pdf');
        }
        return $attachments;
    }

    /**
     * Replace template helper placeholders with actual order values.
     */
    private function replacePlaceholders(string $text): string
    {
        return str_replace([
            '{customer_name}',
            '{order_number}',
            '{total_amount}',
            '{payment_status}',
            '{order_status}',
            '{delivery_method}'
        ], [
            $this->order->customer_name,
            $this->order->order_number,
            '₦' . number_format($this->order->total_amount, 2),
            strtoupper($this->order->payment_status),
            strtoupper(str_replace('_', ' ', $this->order->order_status)),
            strtoupper($this->order->delivery_method)
        ], $text);
    }
}
