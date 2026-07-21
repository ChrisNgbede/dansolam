<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestSmtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientEmail;

    /**
     * Create a new message instance.
     */
    public function __construct(string $recipientEmail)
    {
        $this->recipientEmail = $recipientEmail;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'SMTP Connection Test Email',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: "<div style='font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;'>
                <h2 style='color: #C5A880; font-family: serif; margin-top: 0; font-size: 22px; font-weight: bold;'>Dansolam</h2>
                <p style='font-size: 13px; color: #374151; line-height: 1.5;'>Hello,</p>
                <p style='font-size: 13px; color: #374151; line-height: 1.5;'>This is a test email sent from the <strong>Dansolam Configuration Dashboard</strong> to verify that your SMTP mail server settings are configured correctly.</p>
                <p style='font-size: 13px; color: #059669; font-weight: 600; line-height: 1.5; margin-top: 16px;'>If you are reading this message, it means your SMTP configuration is active and working perfectly! 🎉</p>
                <hr style='border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;'>
                <p style='font-size: 11px; color: #9ca3af; line-height: 1.4;'>This email was dispatched to: {$this->recipientEmail} at " . now()->toCookieString() . ". Please do not reply to this automated message.</p>
            </div>",
        );
    }
}
