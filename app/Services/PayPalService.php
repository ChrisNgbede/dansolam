<?php

namespace App\Services;

use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PayPalService
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $mode;
    protected string $baseUrl;
    protected string $intent;
    protected string $defaultCurrency;
    protected string $storeCurrency;
    protected float $exchangeRate;
    protected bool $enabled;

    public function __construct()
    {
        // Scope to the active storefront. Reading every row unscoped would mix
        // settings from other ecommerce records (including their currency).
        $ecommerce = Ecommerce::first();
        $settings = EcommerceSetting::when(
            $ecommerce,
            fn ($q) => $q->where('ecommerce_id', $ecommerce->id)
        )->pluck('value', 'key')->toArray();

        $this->clientId = $settings['paypal_client_id'] ?? config('services.paypal.client_id', '');
        $this->clientSecret = $settings['paypal_client_secret'] ?? config('services.paypal.client_secret', '');
        $this->mode = $settings['paypal_mode'] ?? 'sandbox';
        $this->baseUrl = $this->mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        $this->intent = strtoupper($settings['paypal_intent'] ?? 'CAPTURE');
        // Prices are stored in the store's own currency. Default PayPal to that same
        // currency so the buyer is charged exactly what the storefront displayed.
        $this->storeCurrency = strtoupper($settings['system_currency_code'] ?? 'USD');
        $this->defaultCurrency = strtoupper($settings['paypal_currency'] ?? $this->storeCurrency);

        $rate = floatval($settings['paypal_exchange_rate'] ?? 1.0);
        // A rate only means anything when the currencies actually differ; when they
        // match, any configured rate would silently distort the total.
        $this->exchangeRate = $this->defaultCurrency === $this->storeCurrency
            ? 1.0
            : ($rate > 0 ? $rate : 1.0);

        $enabledRaw = $settings['paypal_enabled'] ?? 'true';
        $this->enabled = in_array($enabledRaw, ['true', '1', true, 1], true);
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    public function isMockMode(): bool
    {
        return empty($this->clientId) || empty($this->clientSecret) ||
               Str::contains($this->clientId, 'mock') || Str::contains($this->clientSecret, 'mock');
    }

    public function getDefaultCurrency(): string
    {
        return $this->defaultCurrency;
    }

    public function getExchangeRate(): float
    {
        return $this->exchangeRate;
    }

    public function getStoreCurrency(): string
    {
        return $this->storeCurrency;
    }

    /**
     * Charging in a currency other than the store's own requires a real exchange
     * rate. A rate of 1.0 across different currencies would bill the numeric total
     * as-is (e.g. £92.44 charged as $92.44), so treat that as a misconfiguration
     * and refuse the payment rather than take the wrong amount.
     */
    public function getCurrencyConfigError(): ?string
    {
        if ($this->defaultCurrency === $this->storeCurrency) {
            return null;
        }

        if (abs($this->exchangeRate - 1.0) < 0.000001) {
            return sprintf(
                'PayPal is configured to charge in %s but prices are set in %s with no exchange rate. '
                . 'Set "PayPal Currency" to %s, or enter a real %s to %s exchange rate in Settings.',
                $this->defaultCurrency,
                $this->storeCurrency,
                $this->storeCurrency,
                $this->storeCurrency,
                $this->defaultCurrency
            );
        }

        return null;
    }

    /**
     * Public, browser-safe config for the PayPal JS SDK.
     * Deliberately excludes the client secret.
     */
    public function getClientConfig(): array
    {
        return [
            'client_id' => $this->isMockMode() ? null : $this->clientId,
            'currency' => $this->defaultCurrency,
            'intent' => $this->intent,
            'mode' => $this->mode,
            'enabled' => $this->enabled,
            'mock' => $this->isMockMode(),
        ];
    }

    public function getIntent(): string
    {
        return $this->intent;
    }

    /**
     * Get OAuth2 Access Token from PayPal API v1 /v1/oauth2/token
     */
    public function getAccessToken(): ?string
    {
        if ($this->isMockMode()) {
            return 'MOCK-PAYPAL-ACCESS-TOKEN';
        }

        $cacheKey = "paypal_access_token_{$this->mode}_" . md5($this->clientId);
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = Http::asForm()
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->post("{$this->baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['access_token'] ?? null;
                $expiresIn = intval($data['expires_in'] ?? 3600);
                if ($token) {
                    Cache::put($cacheKey, $token, now()->addSeconds(max(60, $expiresIn - 120)));
                    return $token;
                }
            } else {
                Log::error("PayPal OAuth2 Error: " . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error("PayPal OAuth2 Exception: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Create PayPal Order via Orders API v2 (POST /v2/checkout/orders)
     */
    public function createOrder(
        string $orderNumber,
        float $amount,
        ?string $currency = null,
        array $items = [],
        ?string $returnUrl = null,
        ?string $cancelUrl = null
    ): array {
        $configError = $this->getCurrencyConfigError();
        if ($configError) {
            Log::error('PayPal currency misconfiguration: ' . $configError);
            return ['success' => false, 'message' => $configError];
        }

        $targetCurrency = strtoupper($currency ?: $this->defaultCurrency);
        // Amounts arrive in the store currency; only convert when actually leaving it.
        $rate = $targetCurrency === $this->storeCurrency ? 1.0 : $this->exchangeRate;
        $finalAmount = round($amount * $rate, 2);

        if ($this->isMockMode()) {
            $mockOrderId = 'MOCK-PAYPAL-' . strtoupper(Str::random(12));
            return [
                'success' => true,
                'mock' => true,
                'paypal_order_id' => $mockOrderId,
                'status' => 'CREATED',
                'intent' => $this->intent,
                'amount' => $finalAmount,
                'currency' => $targetCurrency,
                'approve_url' => "https://www.sandbox.paypal.com/checkoutnow?token={$mockOrderId}",
                'raw' => [
                    'id' => $mockOrderId,
                    'status' => 'CREATED',
                    'intent' => $this->intent,
                    'purchase_units' => [[
                        'amount' => [
                            'currency_code' => $targetCurrency,
                            'value' => number_format($finalAmount, 2, '.', '')
                        ]
                    ]],
                    'links' => [
                        ['rel' => 'approve', 'href' => "https://www.sandbox.paypal.com/checkoutnow?token={$mockOrderId}", 'method' => 'GET']
                    ]
                ]
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Unable to authenticate with PayPal API',
            ];
        }

        $ecommerce = Ecommerce::first();
        $brandName = $ecommerce->name ?? 'Dansolam Beauty Home';

        $payload = [
            'intent' => $this->intent,
            'purchase_units' => [
                [
                    'reference_id' => $orderNumber,
                    'description' => "Order {$orderNumber} at {$brandName}",
                    'custom_id' => $orderNumber,
                    'invoice_id' => $orderNumber,
                    'amount' => [
                        'currency_code' => $targetCurrency,
                        'value' => number_format($finalAmount, 2, '.', ''),
                    ],
                ]
            ],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'brand_name' => $brandName,
                        'landing_page' => 'NO_PREFERENCE',
                        'user_action' => 'PAY_NOW',
                        'return_url' => $returnUrl ?: url("/checkout?paypal_return=true&order_number={$orderNumber}"),
                        'cancel_url' => $cancelUrl ?: url("/checkout?paypal_cancel=true"),
                    ]
                ]
            ]
        ];

        // Format items if provided
        if (!empty($items)) {
            $formattedItems = [];
            $itemTotal = 0;
            foreach ($items as $item) {
                $itemPrice = round(($item['price'] ?? 0) * $rate, 2);
                $qty = intval($item['quantity'] ?? 1);
                $itemSub = $itemPrice * $qty;
                $itemTotal += $itemSub;

                $formattedItems[] = [
                    'name' => mb_substr($item['product_name'] ?? 'Product', 0, 127),
                    'unit_amount' => [
                        'currency_code' => $targetCurrency,
                        'value' => number_format($itemPrice, 2, '.', ''),
                    ],
                    'quantity' => (string)$qty,
                    'category' => 'PHYSICAL_GOODS',
                ];
            }

            // Include breakdown if item total matches final amount
            if (abs($itemTotal - $finalAmount) < 0.01) {
                $payload['purchase_units'][0]['items'] = $formattedItems;
                $payload['purchase_units'][0]['amount']['breakdown'] = [
                    'item_total' => [
                        'currency_code' => $targetCurrency,
                        'value' => number_format($itemTotal, 2, '.', ''),
                    ]
                ];
            }
        }

        try {
            $response = Http::withToken($token)
                ->contentType('application/json')
                ->post("{$this->baseUrl}/v2/checkout/orders", $payload);

            if ($response->successful()) {
                $resData = $response->json();
                $paypalOrderId = $resData['id'] ?? null;
                $approveUrl = null;

                if (isset($resData['links'])) {
                    foreach ($resData['links'] as $link) {
                        if ($link['rel'] === 'approve' || $link['rel'] === 'payer-action') {
                            $approveUrl = $link['href'];
                            break;
                        }
                    }
                }

                return [
                    'success' => true,
                    'mock' => false,
                    'paypal_order_id' => $paypalOrderId,
                    'status' => $resData['status'] ?? 'CREATED',
                    'intent' => $resData['intent'] ?? $this->intent,
                    'amount' => $finalAmount,
                    'currency' => $targetCurrency,
                    'approve_url' => $approveUrl,
                    'raw' => $resData,
                ];
            } else {
                Log::error("PayPal Create Order Error: " . $response->body());
                return [
                    'success' => false,
                    'message' => 'PayPal order creation failed: ' . ($response->json('message') ?? $response->body()),
                    'raw' => $response->json(),
                ];
            }
        } catch (\Throwable $e) {
            Log::error("PayPal Create Order Exception: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'PayPal API connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Capture payment for PayPal order via Orders API v2 (POST /v2/checkout/orders/{id}/capture)
     */
    public function captureOrder(string $paypalOrderId): array
    {
        if ($this->isMockMode() || Str::startsWith($paypalOrderId, 'MOCK-')) {
            $captureId = 'MOCK-CAP-' . strtoupper(Str::random(12));
            return [
                'success' => true,
                'mock' => true,
                'paypal_order_id' => $paypalOrderId,
                'capture_id' => $captureId,
                'status' => 'COMPLETED',
                'payer' => [
                    'email_address' => 'sandbox-buyer@dansolam.com',
                    'name' => ['given_name' => 'Valued', 'surname' => 'Customer'],
                    'payer_id' => 'PAYER-' . strtoupper(Str::random(8)),
                ],
                'raw' => [
                    'id' => $paypalOrderId,
                    'status' => 'COMPLETED',
                    'purchase_units' => [
                        [
                            'payments' => [
                                'captures' => [
                                    [
                                        'id' => $captureId,
                                        'status' => 'COMPLETED',
                                        'amount' => ['currency_code' => $this->defaultCurrency, 'value' => '100.00'],
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        try {
            $response = Http::withToken($token)
                ->withBody('{}', 'application/json')
                ->post("{$this->baseUrl}/v2/checkout/orders/{$paypalOrderId}/capture");

            if ($response->successful()) {
                $resData = $response->json();
                $status = $resData['status'] ?? '';
                $captureId = null;

                if (isset($resData['purchase_units'][0]['payments']['captures'][0]['id'])) {
                    $captureId = $resData['purchase_units'][0]['payments']['captures'][0]['id'];
                }

                $isCompleted = in_array($status, ['COMPLETED', 'APPROVED']);

                return [
                    'success' => $isCompleted,
                    'mock' => false,
                    'paypal_order_id' => $paypalOrderId,
                    'capture_id' => $captureId,
                    'status' => $status,
                    'payer' => $resData['payer'] ?? null,
                    'raw' => $resData,
                ];
            } else {
                $resJson = $response->json() ?? [];
                Log::error("PayPal Capture Order Error: " . $response->body());
                
                $issue = $resJson['details'][0]['issue'] ?? '';
                $description = $resJson['details'][0]['description'] ?? ($resJson['message'] ?? 'Payment capture was not completed.');
                
                if ($issue === 'ORDER_NOT_APPROVED') {
                    $msg = 'Please approve and authorize the payment in the PayPal window before completing your purchase.';
                } elseif ($issue === 'ORDER_ALREADY_CAPTURED') {
                    return [
                        'success' => true,
                        'mock' => false,
                        'paypal_order_id' => $paypalOrderId,
                        'capture_id' => $paypalOrderId,
                        'status' => 'COMPLETED',
                        'raw' => $resJson,
                    ];
                } else {
                    $msg = $description;
                }

                return [
                    'success' => false,
                    'message' => $msg,
                    'issue' => $issue,
                    'raw' => $resJson,
                ];
            }
        } catch (\Throwable $e) {
            Log::error("PayPal Capture Exception: " . $e->getMessage());
            return ['success' => false, 'message' => 'PayPal capture error: ' . $e->getMessage()];
        }
    }

    /**
     * Authorize payment for order via Orders API v2 (POST /v2/checkout/orders/{id}/authorize)
     */
    public function authorizeOrder(string $paypalOrderId): array
    {
        if ($this->isMockMode() || Str::startsWith($paypalOrderId, 'MOCK-')) {
            $authId = 'MOCK-AUTH-' . strtoupper(Str::random(12));
            return [
                'success' => true,
                'mock' => true,
                'paypal_order_id' => $paypalOrderId,
                'authorization_id' => $authId,
                'status' => 'CREATED',
                'raw' => ['id' => $paypalOrderId, 'status' => 'CREATED']
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        try {
            $response = Http::withToken($token)
                ->withBody('{}', 'application/json')
                ->post("{$this->baseUrl}/v2/checkout/orders/{$paypalOrderId}/authorize");

            if ($response->successful()) {
                $resData = $response->json();
                $authId = $resData['purchase_units'][0]['payments']['authorizations'][0]['id'] ?? null;
                return [
                    'success' => true,
                    'paypal_order_id' => $paypalOrderId,
                    'authorization_id' => $authId,
                    'status' => $resData['status'] ?? 'CREATED',
                    'raw' => $resData,
                ];
            }
            return ['success' => false, 'message' => $response->body(), 'raw' => $response->json()];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Show order details via Orders API v2 (GET /v2/checkout/orders/{id})
     */
    public function showOrderDetails(string $paypalOrderId): array
    {
        if ($this->isMockMode() || Str::startsWith($paypalOrderId, 'MOCK-')) {
            return [
                'success' => true,
                'mock' => true,
                'raw' => [
                    'id' => $paypalOrderId,
                    'status' => 'COMPLETED',
                    'intent' => 'CAPTURE',
                ]
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        try {
            $response = Http::withToken($token)->get("{$this->baseUrl}/v2/checkout/orders/{$paypalOrderId}");
            if ($response->successful()) {
                return ['success' => true, 'raw' => $response->json()];
            }
            return ['success' => false, 'message' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Show captured payment details via Payments API v2 (GET /v2/payments/captures/{id})
     */
    public function showCaptureDetails(string $captureId): array
    {
        if ($this->isMockMode() || Str::startsWith($captureId, 'MOCK-')) {
            return [
                'success' => true,
                'mock' => true,
                'raw' => [
                    'id' => $captureId,
                    'status' => 'COMPLETED',
                    'amount' => ['value' => '100.00', 'currency_code' => $this->defaultCurrency],
                ]
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        try {
            $response = Http::withToken($token)->get("{$this->baseUrl}/v2/payments/captures/{$captureId}");
            if ($response->successful()) {
                return ['success' => true, 'raw' => $response->json()];
            }
            return ['success' => false, 'message' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Refund captured payment via Payments API v2 (POST /v2/payments/captures/{id}/refund)
     */
    public function refundCapture(
        string $captureId,
        ?float $amount = null,
        ?string $currency = null,
        ?string $note = null
    ): array {
        $targetCurrency = strtoupper($currency ?: $this->defaultCurrency);

        if ($this->isMockMode() || Str::startsWith($captureId, 'MOCK-')) {
            $refundId = 'MOCK-REF-' . strtoupper(Str::random(12));
            return [
                'success' => true,
                'mock' => true,
                'refund_id' => $refundId,
                'status' => 'COMPLETED',
                'amount' => $amount,
                'currency' => $targetCurrency,
                'raw' => [
                    'id' => $refundId,
                    'status' => 'COMPLETED',
                    'amount' => ['value' => (string)($amount ?: 0.0), 'currency_code' => $targetCurrency],
                    'note_to_payer' => $note ?: 'Refund processed successfully.'
                ]
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        $payload = [];
        if ($amount !== null && $amount > 0) {
            $payload['amount'] = [
                'value' => number_format($amount, 2, '.', ''),
                'currency_code' => $targetCurrency,
            ];
        }
        if (!empty($note)) {
            $payload['note_to_payer'] = mb_substr($note, 0, 255);
        }

        try {
            $response = Http::withToken($token)
                ->contentType('application/json')
                ->post("{$this->baseUrl}/v2/payments/captures/{$captureId}/refund", $payload);

            if ($response->successful()) {
                $resData = $response->json();
                return [
                    'success' => true,
                    'refund_id' => $resData['id'] ?? null,
                    'status' => $resData['status'] ?? 'COMPLETED',
                    'raw' => $resData,
                ];
            } else {
                Log::error("PayPal Refund Error: " . $response->body());
                return [
                    'success' => false,
                    'message' => 'PayPal refund failed: ' . ($response->json('message') ?? $response->body()),
                    'raw' => $response->json(),
                ];
            }
        } catch (\Throwable $e) {
            Log::error("PayPal Refund Exception: " . $e->getMessage());
            return ['success' => false, 'message' => 'PayPal refund exception: ' . $e->getMessage()];
        }
    }

    /**
     * Show refund details via Payments API v2 (GET /v2/payments/refunds/{id})
     */
    public function showRefundDetails(string $refundId): array
    {
        if ($this->isMockMode() || Str::startsWith($refundId, 'MOCK-')) {
            return [
                'success' => true,
                'mock' => true,
                'raw' => [
                    'id' => $refundId,
                    'status' => 'COMPLETED'
                ]
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        try {
            $response = Http::withToken($token)->get("{$this->baseUrl}/v2/payments/refunds/{$refundId}");
            if ($response->successful()) {
                return ['success' => true, 'raw' => $response->json()];
            }
            return ['success' => false, 'message' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Void authorized payment via Payments API v2 (POST /v2/payments/authorizations/{id}/void)
     */
    public function voidAuthorization(string $authorizationId): array
    {
        if ($this->isMockMode() || Str::startsWith($authorizationId, 'MOCK-')) {
            return [
                'success' => true,
                'mock' => true,
                'raw' => ['id' => $authorizationId, 'status' => 'VOIDED']
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal API'];
        }

        try {
            $response = Http::withToken($token)
                ->contentType('application/json')
                ->post("{$this->baseUrl}/v2/payments/authorizations/{$authorizationId}/void");

            if ($response->successful() || $response->status() === 204) {
                return ['success' => true, 'status' => 'VOIDED'];
            }
            return ['success' => false, 'message' => $response->body()];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
