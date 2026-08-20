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
            htmlString: "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 0; max-width: 600px; margin: 20px auto; border: 1px solid #EADBEE; border-radius: 20px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 30px rgba(93,62,133,0.08);'>
                <div style='background: linear-gradient(135deg, #3D235C 0%, #5D3E85 50%, #EC268F 100%); padding: 32px 24px; text-align: center; color: #ffffff;'>
                    <h2 style='font-family: Georgia, serif; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;'>Dansolam</h2>
                    <p style='margin: 6px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #E5C158;'>SMTP Server Diagnostic Test</p>
                </div>
                <div style='padding: 32px 28px;'>
                    <p style='font-size: 14px; color: #332B3D; line-height: 1.6; margin-top: 0;'>Hello Administrator,</p>
                    <div style='background-color: #FAF7FC; border-left: 4px solid #5D3E85; padding: 16px; border-radius: 8px; font-size: 13px; color: #4A4054; line-height: 1.6; margin: 16px 0;'>
                        This is an official verification email sent from your <strong>Dansolam Store Dashboard</strong> to test that your outgoing SMTP server credentials are valid and reachable.
                    </div>
                    <div style='background-color: #E6F7ED; border: 1px solid #A3E6BA; padding: 14px 18px; border-radius: 12px; font-size: 13px; color: #0E703C; font-weight: 600; line-height: 1.5;'>
                        ✓ SMTP Server Connection Successful! All customer order confirmations and PDF invoices will be delivered reliably.
                    </div>
                    <hr style='border: none; border-top: 1px solid #F0E8F8; margin: 24px 0;'>
                    <p style='font-size: 11px; color: #8C7F9B; line-height: 1.5; margin: 0;'>Dispatched to <strong>{$this->recipientEmail}</strong> on " . now()->format('M d, Y h:i A') . ". Automated message from Dansolam SHOP Platform.</p>
                </div>
            </div>",
        );
    }
}
