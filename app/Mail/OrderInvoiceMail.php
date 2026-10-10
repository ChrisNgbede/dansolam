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
        \App\Services\StoreMailer::apply();
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
        $subject = "Order #{$this->order->order_number} Invoice - Dansolam";
        switch ($this->templateType) {
            case 'order_placed':
                $subject = $settings['email_order_placed_subject'] ?? "Order Confirmed: #{$this->order->order_number} - Dansolam";
                break;
            case 'payment_confirmed':
            case 'payment_success':
            case 'paid':
                $subject = "Payment Confirmed for Order #{$this->order->order_number} - Dansolam";
                break;
            case 'order_processing':
            case 'processing':
                $subject = "Your Order #{$this->order->order_number} is being Processed - Dansolam";
                break;
            case 'order_packed':
            case 'packed':
                $subject = "Your Order #{$this->order->order_number} is Packed & Ready - Dansolam";
                break;
            case 'order_ready_for_pickup':
            case 'ready_for_pickup':
                $subject = "Your Order #{$this->order->order_number} is Ready for In-Store Pickup! - Dansolam";
                break;
            case 'order_shipped':
            case 'shipped':
                $subject = $settings['email_order_shipped_subject'] ?? "Your Order #{$this->order->order_number} has been Dispatched/Shipped! - Dansolam";
                break;
            case 'order_delivered':
            case 'delivered':
                $subject = "Your Order #{$this->order->order_number} has been Delivered! - Dansolam";
                break;
            case 'order_cancelled':
            case 'cancelled':
                $subject = "Update regarding Order #{$this->order->order_number}: Order Cancelled - Dansolam";
                break;
            case 'invoice':
            default:
                $subject = $settings['email_invoice_subject'] ?? "Invoice & Receipt for Order #{$this->order->order_number} - Dansolam";
                break;
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
        switch ($this->templateType) {
            case 'order_placed':
                $bodyTemplate = $settings['email_order_placed_body'] ?? "Hello {customer_name},\n\nThank you for choosing Dansolam! We have received your order #{order_number} for total {total_amount}.\n\nOur beauty and skincare team is preparing your items with utmost care and attention. You will receive real-time updates as your order progresses.\n\nThank you,\nDansolam Beauty Home";
                break;
            case 'payment_confirmed':
            case 'payment_success':
            case 'paid':
                $bodyTemplate = "Hello {customer_name},\n\nGreat news! We have successfully received and confirmed payment of {total_amount} for your order #{order_number}.\n\nYour order is now queued for packaging and fulfillment.\n\nThank you for shopping with Dansolam!";
                break;
            case 'order_processing':
            case 'processing':
                $bodyTemplate = "Hello {customer_name},\n\nYour order #{order_number} is currently being processed and prepared by our fulfillment team.\n\nEach item is carefully formulated, inspected, and packaged to ensure it reaches you in exquisite condition.\n\nWarm regards,\nDansolam Beauty Home";
                break;
            case 'order_packed':
            case 'packed':
                $bodyTemplate = "Hello {customer_name},\n\nYour order #{order_number} has been carefully packed and sealed! It is now staged for dispatch / pickup.\n\nWarm regards,\nDansolam Beauty Home";
                break;
            case 'order_ready_for_pickup':
            case 'ready_for_pickup':
                $bodyTemplate = "Hello {customer_name},\n\nYour order #{order_number} is now ready for in-store pickup at our Dansolam Beauty Home store location!\n\nPlease present this email or your Order Number #{order_number} when collecting your package.\n\nWe look forward to seeing you!\nDansolam Beauty Home";
                break;
            case 'order_shipped':
            case 'shipped':
                $bodyTemplate = $settings['email_order_shipped_body'] ?? "Hello {customer_name},\n\nGood news! Your order #{order_number} has been dispatched and is on its way to your delivery address ({delivery_address}).\n\nYou can track the shipment status anytime using our live tracking portal.\n\nThank you for choosing Dansolam!";
                break;
            case 'order_delivered':
            case 'delivered':
                $bodyTemplate = "Hello {customer_name},\n\nYour order #{order_number} has been successfully delivered! We hope you love your Dansolam luxury skincare and beauty products.\n\nIf you have any feedback or questions, our concierge team is always here to assist you. Enjoy your radiant glow!\n\nWith love,\nDansolam Beauty Home";
                break;
            case 'order_cancelled':
            case 'cancelled':
                $bodyTemplate = "Hello {customer_name},\n\nThis is to notify you that your order #{order_number} has been cancelled.\n\nIf you believe this was done in error or have any questions regarding a refund or replacement, please contact our support team immediately.\n\nWarm regards,\nDansolam Concierge";
                break;
            case 'invoice':
            default:
                $bodyTemplate = $settings['email_invoice_body'] ?? "Hello {customer_name},\n\nPlease find attached the official invoice and receipt for your order #{order_number} of total {total_amount}.\n\nThank you for shopping with Dansolam!\nDansolam Beauty Home";
                break;
        }

        $bodyText = $this->replacePlaceholders($bodyTemplate);

        return new Content(
            view: 'emails.order-notification',
            with: [
                'bodyText' => nl2br($bodyText),
                'order' => $this->order,
                'themeColor' => $settings['theme_primary_color'] ?? '#5D3E85'
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
            '{delivery_method}',
            '{delivery_address}',
            '{customer_phone}'
        ], [
            $this->order->customer_name ?? 'Valued Customer',
            $this->order->order_number ?? '',
            '₦' . number_format((float)($this->order->total_amount ?? 0), 2),
            strtoupper($this->order->payment_status ?? 'PENDING'),
            strtoupper(str_replace('_', ' ', $this->order->order_status ?? 'PENDING')),
            strtoupper($this->order->delivery_method ?? 'DELIVERY'),
            $this->order->delivery_address ?? 'Store Pickup',
            $this->order->customer_phone ?? ''
        ], $text);
    }
}
