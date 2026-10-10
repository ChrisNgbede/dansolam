<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A branded store email: heading, a few paragraphs, an optional list of details
 * and an optional button. Used for welcome, enquiry, booking and alert emails.
 */
class StoreMessage extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $paragraphs  Plain text; escaped when rendered.
     * @param  array<string, string|null>  $details  Label => value rows; empty values are skipped.
     */
    public function __construct(
        public string $subjectLine,
        public string $heading,
        public array $paragraphs = [],
        public array $details = [],
        public ?string $buttonText = null,
        public ?string $buttonUrl = null,
        public ?string $replyToAddress = null,
        public ?string $replyToName = null,
        public ?string $code = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
            replyTo: $this->replyToAddress ? [new Address($this->replyToAddress, $this->replyToName)] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.store-message',
            text: 'emails.store-message-text',
            with: [
                'details' => array_filter($this->details, fn ($v) => $v !== null && $v !== ''),
                'storeName' => config('mail.from.name') ?: 'Dansolam Beauty Home',
            ],
        );
    }
}
