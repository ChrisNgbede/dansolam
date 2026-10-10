<?php

namespace App\Services;

use App\Models\Ecommerce;
use App\Models\EcommerceSetting;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * PayPal REST (Orders v2 / Payments v2) client.
 *
 * Simulation ("mock") mode exists only for local development and tests: it is
 * never available when services.payments.allow_simulation is false, which is
 * the default in production. Without real credentials in production PayPal is
 * simply unavailable instead of silently approving payments.
 */
class PayPalService
{
    /** Currencies PayPal accepts for payments. */
    public const SUPPORTED_CURRENCIES = [
        'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'ILS', 'JPY', 'MYR', 'MXN',
        'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'SGD', 'SEK', 'CHF', 'THB', 'USD',
    ];

    /** Currencies PayPal only accepts as whole numbers. */
    private const ZERO_DECIMAL_CURRENCIES = ['HUF', 'JPY', 'TWD'];

    protected string $clientId;
    protected string $clientSecret;
    protected string $webhookId;
    protected string $mode;
    protected string $baseUrl;
    protected string $intent;
    protected string $defaultCurrency;
    protected string $storeCurrency;
    protected float $exchangeRate;
    protected bool $enabled;
    protected string $brandName;

    public function __construct()
    {
        // Scope to the active storefront. Reading every row unscoped would mix
        // settings from other ecommerce records (including their currency).
        $ecommerce = Ecommerce::first();
        $settings = EcommerceSetting::when(
            $ecommerce,
            fn ($q) => $q->where('ecommerce_id', $ecommerce->id)
        )->pluck('value', 'key')->toArray();

        $this->brandName = mb_substr($ecommerce->name ?? 'Dansolam', 0, 127);
        $this->clientId = trim((string) ($settings['paypal_client_id'] ?? config('services.paypal.client_id', '')));
        $this->clientSecret = trim((string) ($settings['paypal_client_secret'] ?? config('services.paypal.client_secret', '')));
        $this->webhookId = trim((string) ($settings['paypal_webhook_id'] ?? config('services.paypal.webhook_id', '')));
        $this->mode = ($settings['paypal_mode'] ?? 'sandbox') === 'live' ? 'live' : 'sandbox';
        $this->baseUrl = $this->mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        $this->intent = strtoupper($settings['paypal_intent'] ?? 'CAPTURE') === 'AUTHORIZE' ? 'AUTHORIZE' : 'CAPTURE';

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

    // ---------------------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------------------

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    public function isSimulationAllowed(): bool
    {
        return (bool) config('services.payments.allow_simulation', false);
    }

    /**
     * Sandbox payments never move real money, so the live site refuses them unless
     * PAYMENTS_ALLOW_SANDBOX is set for a deliberate test.
     */
    public function isSandboxAllowed(): bool
    {
        return (bool) config('services.payments.allow_sandbox', false);
    }

    public function getMode(): string
    {
        return $this->mode;
    }

    public function hasCredentials(): bool
    {
        return $this->clientId !== '' && $this->clientSecret !== ''
            && !Str::contains($this->clientId, 'mock') && !Str::contains($this->clientSecret, 'mock');
    }

    /**
     * True only in development/testing when no real credentials are configured.
     */
    public function isMockMode(): bool
    {
        return $this->isSimulationAllowed() && !$this->hasCredentials();
    }

    /**
     * Why PayPal can't take payments right now, or null when it can.
     */
    public function getConfigError(): ?string
    {
        if (!$this->enabled) {
            return 'PayPal is not enabled for this store.';
        }
        if (!$this->hasCredentials() && !$this->isMockMode()) {
            return 'PayPal is not configured yet. Please choose another payment method.';
        }
        if ($this->mode === 'sandbox' && $this->hasCredentials() && !$this->isSandboxAllowed()) {
            return 'Card and PayPal payments are not available right now. Please choose another payment method.';
        }

        return $this->getCurrencyConfigError();
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

    public function getIntent(): string
    {
        return $this->intent;
    }

    public function getWebhookId(): string
    {
        return $this->webhookId;
    }

    /**
     * Charging in a currency other than the store's own requires a real exchange
     * rate, and the currency must be one PayPal supports. Otherwise refuse the
     * payment rather than take the wrong amount.
     */
    public function getCurrencyConfigError(): ?string
    {
        if (!in_array($this->defaultCurrency, self::SUPPORTED_CURRENCIES, true)) {
            return sprintf(
                'PayPal does not accept %s. Choose a supported "PayPal Currency" (e.g. GBP, USD, EUR) and set an exchange rate in Settings.',
                $this->defaultCurrency
            );
        }

        if ($this->defaultCurrency !== $this->storeCurrency && abs($this->exchangeRate - 1.0) < 0.000001) {
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
     * Billing details PayPal uses to pre-fill its card form, from what the customer
     * already gave at checkout. Only well-formed values are included.
     */
    public static function payerFromOrder(object $order): ?array
    {
        $country = \App\Support\Countries::code($order->delivery_country ?? null);
        $payer = [];

        $parts = preg_split('/\s+/', trim((string) ($order->customer_name ?? '')), -1, PREG_SPLIT_NO_EMPTY);
        if ($parts) {
            $surname = count($parts) > 1 ? array_pop($parts) : '';
            $payer['name'] = array_filter([
                'given_name' => mb_substr(implode(' ', $parts), 0, 140),
                'surname' => mb_substr($surname, 0, 140),
            ]);
        }

        if (filter_var($order->customer_email ?? null, FILTER_VALIDATE_EMAIL)) {
            $payer['email_address'] = $order->customer_email;
        }

        // National number only: drop "+", the country's dialling code and a leading 0.
        $digits = preg_replace('/\D/', '', (string) ($order->customer_phone ?? ''));
        $calling = \App\Support\Countries::callingCode($order->delivery_country ?? null);
        // Only when the number clearly belongs to the order's country; a number from
        // another country would show under the wrong dialling code, so leave it blank.
        $national = null;
        if ($digits !== '' && $calling) {
            if (str_starts_with($digits, $calling) && strlen($digits) >= strlen($calling) + 6) {
                $national = substr($digits, strlen($calling));
            } elseif (str_starts_with($digits, '0') || strlen($digits) <= 11) {
                $national = $digits;
            }
        }
        if ($national !== null) {
            $national = ltrim($national, '0');
            if (strlen($national) >= 6 && strlen($national) <= 14) {
                $payer['phone'] = ['phone_type' => 'MOBILE', 'phone_number' => ['national_number' => $national]];
            }
        }

        if ($country) {
            $state = trim((string) ($order->delivery_state ?? ''));
            $address = array_filter([
                'address_line_1' => mb_substr(trim((string) ($order->delivery_address ?? '')), 0, 300),
                'admin_area_2' => mb_substr(trim((string) ($order->delivery_city ?? '')), 0, 120),
                'admin_area_1' => str_contains($state, 'All Regions') ? '' : mb_substr($state, 0, 300),
                'postal_code' => mb_substr(strtoupper(trim((string) ($order->delivery_postcode ?? ''))), 0, 60),
                'country_code' => $country,
            ]);
            $payer['address'] = $address;
        }

        return $payer ?: null;
    }

    /**
     * Public, browser-safe config for the PayPal JS SDK. Never includes the secret.
     */
    public function getClientConfig(): array
    {
        return [
            'client_id' => $this->hasCredentials() ? $this->clientId : null,
            'currency' => $this->defaultCurrency,
            'intent' => $this->intent,
            'mode' => $this->mode,
            'enabled' => $this->enabled && $this->getConfigError() === null,
            'mock' => $this->isMockMode(),
        ];
    }

    /**
     * Convert a store-currency amount into the amount PayPal will charge.
     */
    public function convertAmount(float $storeAmount): float
    {
        $decimals = $this->decimalsFor($this->defaultCurrency);
        return round($storeAmount * $this->exchangeRate, $decimals);
    }

    public function formatAmount(float $amount, ?string $currency = null): string
    {
        $decimals = $this->decimalsFor($currency ?: $this->defaultCurrency);
        return number_format(round($amount, $decimals), $decimals, '.', '');
    }

    private function decimalsFor(string $currency): int
    {
        return in_array(strtoupper($currency), self::ZERO_DECIMAL_CURRENCIES, true) ? 0 : 2;
    }

    // ---------------------------------------------------------------------
    // HTTP
    // ---------------------------------------------------------------------

    /**
     * OAuth2 access token (cached until shortly before it expires).
     */
    public function getAccessToken(): ?string
    {
        if ($this->isMockMode()) {
            return 'MOCK-PAYPAL-ACCESS-TOKEN';
        }
        if (!$this->hasCredentials()) {
            return null;
        }

        $cacheKey = "paypal_access_token_{$this->mode}_" . md5($this->clientId . $this->clientSecret);
        if ($token = Cache::get($cacheKey)) {
            return $token;
        }

        try {
            $response = Http::asForm()
                ->timeout(15)
                ->retry(2, 300, throw: false)
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->post("{$this->baseUrl}/v1/oauth2/token", ['grant_type' => 'client_credentials']);

            if ($response->successful() && ($token = $response->json('access_token'))) {
                $expiresIn = (int) $response->json('expires_in', 3600);
                Cache::put($cacheKey, $token, now()->addSeconds(max(60, $expiresIn - 120)));
                return $token;
            }

            Log::error('PayPal OAuth2 error', ['status' => $response->status(), 'body' => $response->json()]);
        } catch (\Throwable $e) {
            Log::error('PayPal OAuth2 exception: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Authenticated JSON request. `$requestId` makes the call idempotent: PayPal
     * returns the original result instead of repeating the action on a retry.
     */
    private function send(string $method, string $path, ?array $payload = null, ?string $requestId = null): Response|array
    {
        $token = $this->getAccessToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Unable to authenticate with PayPal. Please try again shortly.'];
        }

        try {
            $request = Http::withToken($token)
                ->acceptJson()
                ->timeout(30)
                ->withHeaders(array_filter([
                    'PayPal-Request-Id' => $requestId,
                    'Prefer' => 'return=representation',
                ]));

            return match ($method) {
                'GET' => $request->get("{$this->baseUrl}{$path}"),
                default => $request->withBody(json_encode($payload ?: new \stdClass()), 'application/json')
                    ->post("{$this->baseUrl}{$path}"),
            };
        } catch (\Throwable $e) {
            Log::error("PayPal {$method} {$path} exception: " . $e->getMessage());
            return ['success' => false, 'message' => 'Could not reach PayPal. Please try again.'];
        }
    }

    private function errorFrom(Response $response, string $fallback): array
    {
        $json = $response->json() ?? [];
        Log::warning('PayPal API error', ['status' => $response->status(), 'body' => $json]);

        return [
            'success' => false,
            'issue' => $json['details'][0]['issue'] ?? ($json['name'] ?? null),
            'message' => $json['details'][0]['description'] ?? ($json['message'] ?? $fallback),
            'raw' => $json,
        ];
    }

    // ---------------------------------------------------------------------
    // Orders API
    // ---------------------------------------------------------------------

    /**
     * Create a PayPal order for a store order. `$amount` and item prices are in
     * the store currency; they are converted to the PayPal currency here.
     */
    public function createOrder(
        string $orderNumber,
        float $amount,
        ?string $currency = null,
        array $items = [],
        ?string $returnUrl = null,
        ?string $cancelUrl = null,
        bool $forSdkButtons = false,
        ?array $payer = null
    ): array {
        if ($error = $this->getConfigError()) {
            return ['success' => false, 'message' => $error];
        }

        $targetCurrency = $this->defaultCurrency;
        $finalAmount = $this->convertAmount($amount);
        if ($finalAmount <= 0) {
            return ['success' => false, 'message' => 'Order total must be greater than zero.'];
        }

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
                'approve_url' => null,
                'raw' => ['id' => $mockOrderId, 'status' => 'CREATED'],
            ];
        }

        $unit = [
            'reference_id' => $orderNumber,
            'description' => mb_substr("Order {$orderNumber} at {$this->brandName}", 0, 127),
            'custom_id' => $orderNumber,
            'invoice_id' => $orderNumber,
            'amount' => [
                'currency_code' => $targetCurrency,
                'value' => $this->formatAmount($finalAmount, $targetCurrency),
            ],
        ];

        // Itemise only when the line items add up exactly; PayPal rejects mismatches,
        // and totals that include shipping/tax/discounts would not.
        if ($items) {
            $lines = [];
            $itemTotal = 0.0;
            foreach ($items as $item) {
                $price = $this->convertAmount((float) ($item['price'] ?? 0));
                $qty = max(1, (int) ($item['quantity'] ?? 1));
                $itemTotal += $price * $qty;
                $lines[] = [
                    'name' => mb_substr($item['product_name'] ?? 'Product', 0, 127),
                    'unit_amount' => ['currency_code' => $targetCurrency, 'value' => $this->formatAmount($price, $targetCurrency)],
                    'quantity' => (string) $qty,
                    'category' => 'PHYSICAL_GOODS',
                ];
            }
            if (abs($itemTotal - $finalAmount) < 0.005) {
                $unit['items'] = $lines;
                $unit['amount']['breakdown'] = [
                    'item_total' => ['currency_code' => $targetCurrency, 'value' => $this->formatAmount($itemTotal, $targetCurrency)],
                ];
            }
        }

        // Orders paid through PayPal's on-page buttons (card form or PayPal popup) must
        // not be tied to the PayPal wallet, or the card button cannot pay them.
        $payload = $forSdkButtons ? [
            'intent' => $this->intent,
            'purchase_units' => [$unit],
            'application_context' => [
                'brand_name' => $this->brandName,
                'shipping_preference' => 'NO_SHIPPING',
                'user_action' => 'PAY_NOW',
            ],
        ] : [
            'intent' => $this->intent,
            'purchase_units' => [$unit],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'brand_name' => $this->brandName,
                        'landing_page' => 'NO_PREFERENCE',
                        'shipping_preference' => 'NO_SHIPPING',
                        'user_action' => 'PAY_NOW',
                        'return_url' => $returnUrl ?: url("/checkout?paypal_return=true&order_number={$orderNumber}"),
                        'cancel_url' => $cancelUrl ?: url('/checkout?paypal_cancel=true'),
                    ],
                ],
            ],
        ];

        // Pre-fills PayPal's card form (billing name, address, email, mobile).
        if ($forSdkButtons && $payer) {
            $payload['payer'] = $payer;
        }

        // Same order + same amount (+ same details) => same PayPal order on retries.
        $requestId = "create-{$orderNumber}-" . ($forSdkButtons ? 'sdk-' : '')
            . md5($targetCurrency . $unit['amount']['value'] . json_encode($payload['payer'] ?? null));
        $response = $this->send('POST', '/v2/checkout/orders', $payload, $requestId);

        // Pre-filled details are a convenience: if PayPal objects to any of them,
        // create the order without them rather than block the payment.
        if (!is_array($response) && isset($payload['payer']) && in_array($response->status(), [400, 422], true)
            && str_contains($response->body(), '/payer')) {
            Log::info('PayPal rejected pre-filled payer details; retrying without them', ['order' => $orderNumber, 'body' => $response->json('details')]);
            unset($payload['payer']);
            $response = $this->send('POST', '/v2/checkout/orders', $payload, $requestId . '-plain');
        }
        if (is_array($response)) {
            return $response;
        }
        if (!$response->successful()) {
            return $this->errorFrom($response, 'PayPal order could not be created.');
        }

        $data = $response->json();
        $approveUrl = collect($data['links'] ?? [])
            ->first(fn ($link) => in_array($link['rel'] ?? '', ['approve', 'payer-action'], true))['href'] ?? null;

        return [
            'success' => true,
            'mock' => false,
            'environment' => $this->mode,
            'paypal_order_id' => $data['id'] ?? null,
            'status' => $data['status'] ?? 'CREATED',
            'intent' => $data['intent'] ?? $this->intent,
            'amount' => $finalAmount,
            'currency' => $targetCurrency,
            'approve_url' => $approveUrl,
            'raw' => $data,
        ];
    }

    /**
     * Capture an approved order. On success the result describes the actual
     * capture (status, amount, currency, custom_id) so callers can verify it.
     */
    public function captureOrder(string $paypalOrderId, array $simulate = []): array
    {
        if ($this->isMockMode()) {
            return $this->simulatedPayment($paypalOrderId, 'capture', $simulate);
        }

        $response = $this->send('POST', "/v2/checkout/orders/{$paypalOrderId}/capture", null, "capture-{$paypalOrderId}");
        if (is_array($response)) {
            return $response;
        }

        if (!$response->successful()) {
            $error = $this->errorFrom($response, 'Payment capture was not completed.');
            if ($error['issue'] === 'ORDER_ALREADY_CAPTURED') {
                // Look the order up instead of assuming — the caller still verifies it.
                $details = $this->showOrderDetails($paypalOrderId);
                return $details['success'] ? $this->describePayment($details['raw'], 'capture') : $details;
            }
            if ($error['issue'] === 'ORDER_NOT_APPROVED') {
                $error['message'] = 'Please approve the payment in the PayPal window before completing your purchase.';
            } elseif ($error['issue'] === 'INSTRUMENT_DECLINED') {
                $error['message'] = 'Your payment method was declined. Please choose another funding source in PayPal.';
            }
            return $error;
        }

        return $this->describePayment($response->json(), 'capture');
    }

    /**
     * Authorize an approved order (intent AUTHORIZE). Funds are held until an
     * admin captures or voids the authorization.
     */
    public function authorizeOrder(string $paypalOrderId, array $simulate = []): array
    {
        if ($this->isMockMode()) {
            return $this->simulatedPayment($paypalOrderId, 'authorization', $simulate);
        }

        $response = $this->send('POST', "/v2/checkout/orders/{$paypalOrderId}/authorize", null, "authorize-{$paypalOrderId}");
        if (is_array($response)) {
            return $response;
        }
        if (!$response->successful()) {
            $error = $this->errorFrom($response, 'Payment authorization was not completed.');
            if ($error['issue'] === 'ORDER_ALREADY_AUTHORIZED') {
                $details = $this->showOrderDetails($paypalOrderId);
                return $details['success'] ? $this->describePayment($details['raw'], 'authorization') : $details;
            }
            return $error;
        }

        return $this->describePayment($response->json(), 'authorization');
    }

    public function showOrderDetails(string $paypalOrderId): array
    {
        if ($this->isMockMode()) {
            return ['success' => true, 'mock' => true, 'raw' => ['id' => $paypalOrderId, 'status' => 'APPROVED', 'intent' => $this->intent]];
        }

        $response = $this->send('GET', "/v2/checkout/orders/{$paypalOrderId}");
        if (is_array($response)) {
            return $response;
        }

        return $response->successful()
            ? ['success' => true, 'raw' => $response->json()]
            : $this->errorFrom($response, 'Could not load the PayPal order.');
    }

    /**
     * Normalise an order/capture response into the fields callers verify.
     *
     * @param 'capture'|'authorization' $kind
     */
    private function describePayment(array $data, string $kind): array
    {
        $unit = $data['purchase_units'][0] ?? [];
        $payment = $unit['payments'][$kind === 'capture' ? 'captures' : 'authorizations'][0] ?? null;
        $status = $payment['status'] ?? null;

        // COMPLETED capture = money received. PENDING = PayPal is reviewing (eCheck,
        // risk review); CREATED authorization = funds held.
        $ok = $kind === 'capture'
            ? in_array($status, ['COMPLETED', 'PENDING'], true)
            : in_array($status, ['CREATED', 'PENDING'], true);

        return [
            'success' => $ok,
            'mock' => false,
            'message' => $ok ? null : 'PayPal did not complete the payment' . ($status ? " (status: {$status})." : '.'),
            'paypal_order_id' => $data['id'] ?? null,
            'order_status' => $data['status'] ?? null,
            $kind === 'capture' ? 'capture_id' : 'authorization_id' => $payment['id'] ?? null,
            'status' => $status,
            'pending' => $status === 'PENDING',
            'amount' => isset($payment['amount']['value']) ? (float) $payment['amount']['value'] : null,
            'currency' => $payment['amount']['currency_code'] ?? null,
            'custom_id' => $payment['custom_id'] ?? ($unit['custom_id'] ?? null),
            'payer' => $data['payer'] ?? null,
            'raw' => $data,
        ];
    }

    /**
     * Development-only stand-in for a PayPal capture/authorization.
     */
    private function simulatedPayment(string $paypalOrderId, string $kind, array $simulate): array
    {
        $id = 'MOCK-' . ($kind === 'capture' ? 'CAP' : 'AUTH') . '-' . strtoupper(Str::random(12));
        $amount = (float) ($simulate['amount'] ?? 0);
        $currency = $simulate['currency'] ?? $this->defaultCurrency;
        $status = $kind === 'capture' ? 'COMPLETED' : 'CREATED';

        return [
            'success' => true,
            'mock' => true,
            'paypal_order_id' => $paypalOrderId,
            $kind === 'capture' ? 'capture_id' : 'authorization_id' => $id,
            'status' => $status,
            'pending' => false,
            'amount' => $amount,
            'currency' => $currency,
            'custom_id' => $simulate['custom_id'] ?? null,
            'payer' => ['email_address' => 'sandbox-buyer@example.com', 'name' => ['given_name' => 'Test', 'surname' => 'Buyer']],
            'raw' => [
                'id' => $paypalOrderId,
                'status' => 'COMPLETED',
                'purchase_units' => [[
                    'payments' => [($kind === 'capture' ? 'captures' : 'authorizations') => [[
                        'id' => $id,
                        'status' => $status,
                        'amount' => ['currency_code' => $currency, 'value' => $this->formatAmount($amount, $currency)],
                    ]]],
                ]],
            ],
        ];
    }

    // ---------------------------------------------------------------------
    // Payments API
    // ---------------------------------------------------------------------

    public function showCaptureDetails(string $captureId): array
    {
        if ($this->isMockMode()) {
            return ['success' => true, 'mock' => true, 'raw' => ['id' => $captureId, 'status' => 'COMPLETED']];
        }

        $response = $this->send('GET', "/v2/payments/captures/{$captureId}");
        if (is_array($response)) {
            return $response;
        }

        return $response->successful()
            ? ['success' => true, 'raw' => $response->json()]
            : $this->errorFrom($response, 'Could not load the PayPal capture.');
    }

    /**
     * Capture a previously authorized payment (admin action).
     */
    public function captureAuthorization(string $authorizationId, ?float $amount = null, ?string $currency = null): array
    {
        $currency = $currency ?: $this->defaultCurrency;

        if ($this->isMockMode()) {
            return [
                'success' => true,
                'mock' => true,
                'capture_id' => 'MOCK-CAP-' . strtoupper(Str::random(12)),
                'status' => 'COMPLETED',
                'amount' => $amount,
                'currency' => $currency,
                'raw' => [],
            ];
        }

        $payload = ['final_capture' => true];
        if ($amount !== null) {
            $payload['amount'] = ['currency_code' => $currency, 'value' => $this->formatAmount($amount, $currency)];
        }

        $response = $this->send('POST', "/v2/payments/authorizations/{$authorizationId}/capture", $payload, "auth-capture-{$authorizationId}");
        if (is_array($response)) {
            return $response;
        }
        if (!$response->successful()) {
            return $this->errorFrom($response, 'The authorized payment could not be captured.');
        }

        $data = $response->json();
        return [
            'success' => in_array($data['status'] ?? '', ['COMPLETED', 'PENDING'], true),
            'mock' => false,
            'capture_id' => $data['id'] ?? null,
            'status' => $data['status'] ?? null,
            'amount' => isset($data['amount']['value']) ? (float) $data['amount']['value'] : $amount,
            'currency' => $data['amount']['currency_code'] ?? $currency,
            'raw' => $data,
        ];
    }

    public function voidAuthorization(string $authorizationId): array
    {
        if ($this->isMockMode()) {
            return ['success' => true, 'mock' => true, 'status' => 'VOIDED'];
        }

        $response = $this->send('POST', "/v2/payments/authorizations/{$authorizationId}/void", null, "void-{$authorizationId}");
        if (is_array($response)) {
            return $response;
        }

        return $response->successful()
            ? ['success' => true, 'status' => 'VOIDED']
            : $this->errorFrom($response, 'The authorization could not be voided.');
    }

    /**
     * Refund a capture (full when $amount is null). Amount is in the PayPal currency.
     */
    public function refundCapture(
        string $captureId,
        ?float $amount = null,
        ?string $currency = null,
        ?string $note = null,
        ?string $requestId = null
    ): array {
        $targetCurrency = strtoupper($currency ?: $this->defaultCurrency);

        if ($this->isMockMode()) {
            return [
                'success' => true,
                'mock' => true,
                'refund_id' => 'MOCK-REF-' . strtoupper(Str::random(12)),
                'status' => 'COMPLETED',
                'amount' => $amount,
                'currency' => $targetCurrency,
                'raw' => [],
            ];
        }

        $payload = [];
        if ($amount !== null && $amount > 0) {
            $payload['amount'] = ['value' => $this->formatAmount($amount, $targetCurrency), 'currency_code' => $targetCurrency];
        }
        if (!empty($note)) {
            $payload['note_to_payer'] = mb_substr($note, 0, 255);
        }

        $response = $this->send('POST', "/v2/payments/captures/{$captureId}/refund", $payload, $requestId);
        if (is_array($response)) {
            return $response;
        }
        if (!$response->successful()) {
            return $this->errorFrom($response, 'PayPal refund failed.');
        }

        $data = $response->json();
        return [
            'success' => in_array($data['status'] ?? '', ['COMPLETED', 'PENDING'], true),
            'refund_id' => $data['id'] ?? null,
            'status' => $data['status'] ?? null,
            'amount' => isset($data['amount']['value']) ? (float) $data['amount']['value'] : $amount,
            'currency' => $data['amount']['currency_code'] ?? $targetCurrency,
            'raw' => $data,
        ];
    }

    public function showRefundDetails(string $refundId): array
    {
        if ($this->isMockMode()) {
            return ['success' => true, 'mock' => true, 'raw' => ['id' => $refundId, 'status' => 'COMPLETED']];
        }

        $response = $this->send('GET', "/v2/payments/refunds/{$refundId}");
        if (is_array($response)) {
            return $response;
        }

        return $response->successful()
            ? ['success' => true, 'raw' => $response->json()]
            : $this->errorFrom($response, 'Could not load the PayPal refund.');
    }

    // ---------------------------------------------------------------------
    // Webhooks
    // ---------------------------------------------------------------------

    /**
     * Ask PayPal to confirm a webhook delivery really came from PayPal.
     */
    public function verifyWebhookSignature(array $headers, string $rawBody): bool
    {
        if ($this->webhookId === '' || !$this->hasCredentials()) {
            return false;
        }

        $event = json_decode($rawBody, true);
        if (!is_array($event)) {
            return false;
        }

        $header = fn (string $name) => $headers[strtolower($name)][0] ?? $headers[$name][0] ?? null;

        $response = $this->send('POST', '/v1/notifications/verify-webhook-signature', [
            'auth_algo' => $header('paypal-auth-algo'),
            'cert_url' => $header('paypal-cert-url'),
            'transmission_id' => $header('paypal-transmission-id'),
            'transmission_sig' => $header('paypal-transmission-sig'),
            'transmission_time' => $header('paypal-transmission-time'),
            'webhook_id' => $this->webhookId,
            'webhook_event' => $event,
        ]);

        return !is_array($response)
            && $response->successful()
            && $response->json('verification_status') === 'SUCCESS';
    }
}
