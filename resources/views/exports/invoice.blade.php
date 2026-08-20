<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $order->order_number }}</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 11px;
            color: #332B3D;
            margin: 0;
            padding: 0;
            background-color: #FBFAF8;
        }

        /* ── LUXURY HEADER BANNER ── */
        .header-banner {
            background-color: {{ $brandDark ?? '#17101F' }};
            padding: 30px 36px;
            position: relative;
            overflow: hidden;
        }
        .header-banner::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 100%;
            background: linear-gradient(135deg, transparent 0%, {{ $brandAccent ?? '#EC268F' }}22 100%);
        }
        .brand-row {
            width: 100%;
        }
        .brand-row td {
            vertical-align: middle;
        }
        .brand-logo-cell {
            width: 50%;
        }
        .brand-logo-cell img {
            max-height: 42px;
            max-width: 160px;
            object-fit: contain;
        }
        .brand-text-fallback {
            font-size: 22px;
            font-weight: bold;
            color: #F3EFF6;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .brand-tagline {
            font-size: 9px;
            color: {{ $brandGold ?? '#E5C158' }};
            letter-spacing: 3px;
            text-transform: uppercase;
            font-weight: 600;
            margin-top: 4px;
        }
        .invoice-title-cell {
            width: 50%;
            text-align: right;
        }
        .invoice-title-label {
            font-size: 22px;
            font-weight: bold;
            color: #F3EFF6;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .invoice-number {
            font-size: 11px;
            color: {{ $brandGold ?? '#E5C158' }};
            font-weight: 600;
            margin-top: 4px;
        }

        /* ── ACCENT STRIPE ── */
        .accent-stripe {
            height: 4px;
            background: linear-gradient(90deg, {{ $brandPrimary ?? '#5D3E85' }} 0%, {{ $brandAccent ?? '#EC268F' }} 50%, {{ $brandGold ?? '#E5C158' }} 100%);
        }

        /* ── BODY CONTAINER ── */
        .invoice-body {
            padding: 30px 36px;
            background-color: #ffffff;
        }

        /* ── META DETAILS ── */
        .meta-grid {
            width: 100%;
            margin-bottom: 28px;
            border-collapse: collapse;
        }
        .meta-grid td {
            vertical-align: top;
            padding: 0;
        }
        .meta-box {
            background-color: #FAF7FC;
            border: 1px solid #EADBEE;
            border-radius: 10px;
            padding: 14px 18px;
        }
        .meta-box-title {
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: {{ $brandPrimary ?? '#5D3E85' }};
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #EADBEE;
        }
        .meta-box-line {
            font-size: 11px;
            color: #4A4054;
            line-height: 1.7;
        }
        .meta-box-line strong {
            color: #221B2B;
        }

        /* ── INVOICE METADATA PILLS ── */
        .meta-pills {
            margin-bottom: 20px;
        }
        .meta-pill {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 6px;
        }
        .pill-date {
            background-color: #F0E8F8;
            color: {{ $brandPrimary ?? '#5D3E85' }};
        }
        .pill-method {
            background-color: #FFF8E6;
            color: #B25E00;
        }
        .pill-paid {
            background-color: #E6F7ED;
            color: #0E703C;
        }
        .pill-pending {
            background-color: #FFF2F0;
            color: #CC3300;
        }

        /* ── ITEMS TABLE ── */
        .section-label {
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: {{ $brandPrimary ?? '#5D3E85' }};
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1.5px solid #EADBEE;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        .items-table th {
            background-color: {{ $brandDark ?? '#17101F' }};
            color: #D8D0E2;
            padding: 10px 12px;
            text-align: left;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .items-table th:first-child {
            border-radius: 8px 0 0 0;
        }
        .items-table th:last-child {
            border-radius: 0 8px 0 0;
            text-align: right;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #F0E8F8;
            font-size: 11px;
            vertical-align: middle;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .item-name {
            font-weight: 700;
            color: #221B2B;
        }
        .item-variant {
            font-size: 10px;
            color: #8C7F9B;
            margin-top: 2px;
        }
        .items-table .col-price,
        .items-table .col-qty {
            text-align: center;
        }
        .items-table .col-total {
            text-align: right;
            font-weight: 700;
            color: #221B2B;
        }

        /* ── SUMMARY / TOTALS ── */
        .summary-section {
            width: 100%;
            margin-bottom: 24px;
        }
        .summary-box {
            float: right;
            width: 280px;
            background-color: #FAF7FC;
            border: 1px solid #EADBEE;
            border-radius: 12px;
            padding: 16px 20px;
        }
        .summary-box table {
            width: 100%;
            border-collapse: collapse;
        }
        .summary-box td {
            padding: 5px 0;
            font-size: 11px;
        }
        .summary-label {
            color: #7B6E8A;
        }
        .summary-value {
            text-align: right;
            font-weight: 600;
            color: #332B3D;
        }
        .summary-discount {
            color: #0E703C;
        }
        .total-row td {
            padding-top: 12px;
            border-top: 2px solid {{ $brandPrimary ?? '#5D3E85' }};
            font-size: 15px;
            font-weight: 800;
        }
        .total-row .summary-label {
            color: {{ $brandPrimary ?? '#5D3E85' }};
        }
        .total-row .summary-value {
            color: {{ $brandPrimary ?? '#5D3E85' }};
        }

        /* ── TRUST SIGNALS ── */
        .trust-strip {
            clear: both;
            background-color: #FAF7FC;
            border: 1px solid #EADBEE;
            border-radius: 10px;
            padding: 14px 20px;
            text-align: center;
            font-size: 10px;
            color: #6B6274;
            font-weight: 600;
            margin-top: 30px;
            margin-bottom: 16px;
        }

        /* ── FOOTER ── */
        .footer-banner {
            background-color: {{ $brandDark ?? '#17101F' }};
            padding: 24px 36px;
            text-align: center;
            color: #9C90A9;
            font-size: 10px;
            line-height: 1.7;
        }
        .footer-brand {
            font-size: 12px;
            font-weight: 700;
            color: #F3EFF6;
            margin-bottom: 4px;
        }
        .footer-gold {
            color: {{ $brandGold ?? '#E5C158' }};
            font-weight: 600;
        }
        .footer-legal {
            font-size: 9px;
            color: #7B6E8A;
            margin-top: 8px;
        }
    </style>
</head>
<body>

    <!-- ── LUXURY HEADER BANNER ── -->
    <div class="header-banner">
        <table class="brand-row" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td class="brand-logo-cell">
                    @if(!empty($logoUrl))
                        <img src="{{ $logoUrl }}" alt="{{ $ecommerceName }}" />
                    @else
                        <div class="brand-text-fallback">{{ $ecommerceName }}</div>
                    @endif
                    <div class="brand-tagline">{{ $brandTagline ?? 'Luxury Skincare & Beauty Home' }}</div>
                </td>
                <td class="invoice-title-cell">
                    <div class="invoice-title-label">Invoice</div>
                    <div class="invoice-number">#{{ $order->order_number }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- ── GRADIENT ACCENT STRIPE ── -->
    <div class="accent-stripe"></div>

    <!-- ── MAIN BODY ── -->
    <div class="invoice-body">

        <!-- Invoice Meta Pills -->
        <div class="meta-pills">
            <span class="meta-pill pill-date">📅 {{ $order->created_at->format('M d, Y') }}</span>
            <span class="meta-pill pill-method">💳 {{ strtoupper(str_replace('_', ' ', $order->payment_method)) }}</span>
            <span class="meta-pill {{ $order->payment_status === 'paid' ? 'pill-paid' : 'pill-pending' }}">
                {{ $order->payment_status === 'paid' ? '✓ PAID' : '⏳ ' . strtoupper($order->payment_status) }}
            </span>
        </div>

        <!-- Billed From / Billed To -->
        <table class="meta-grid" style="width: 100%; border-collapse: separate; border-spacing: 10px 0;">
            <tr>
                <td style="width: 50%;">
                    <div class="meta-box">
                        <div class="meta-box-title">Billed From</div>
                        <div class="meta-box-line">
                            <strong>{{ $ecommerceName }}</strong><br>
                            @if(!empty($storeAddress)){{ $storeAddress }}<br>@endif
                            @if(!empty($storePhone))📞 {{ $storePhone }}<br>@endif
                            @if(!empty($storeEmail))✉ {{ $storeEmail }}<br>@endif
                            @if(!empty($whatsappNumber))WhatsApp: {{ $whatsappNumber }}@endif
                        </div>
                    </div>
                </td>
                <td style="width: 50%;">
                    <div class="meta-box">
                        <div class="meta-box-title">Billed To</div>
                        <div class="meta-box-line">
                            <strong>{{ $order->customer_name }}</strong><br>
                            ✉ {{ $order->customer_email }}<br>
                            @if(!empty($order->customer_phone))📞 {{ $order->customer_phone }}<br>@endif
                            @if($order->delivery_method === 'delivery')
                                📍 {{ $order->delivery_address }}
                                @if(!empty($order->delivery_city)), {{ $order->delivery_city }}@endif
                                @if(!empty($order->delivery_state)), {{ $order->delivery_state }}@endif
                                @if(!empty($order->delivery_country)), {{ $order->delivery_country }}@endif
                            @else
                                📍 Store Pickup
                            @endif
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- ── ITEMIZED LINE ITEMS ── -->
        <div class="section-label">Order Line Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 45%;">Product</th>
                    <th class="col-price" style="width: 18%;">Unit Price</th>
                    <th class="col-qty" style="width: 12%;">Qty</th>
                    <th class="col-total" style="width: 25%;">Line Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                    <tr>
                        <td>
                            <div class="item-name">{{ $item->product_name }}</div>
                            @if(!empty($item->variant_label))
                                <div class="item-variant">{{ $item->variant_label }}</div>
                            @endif
                        </td>
                        <td class="col-price">&#8358;{{ number_format($item->price, 2) }}</td>
                        <td class="col-qty">{{ $item->quantity }}</td>
                        <td class="col-total">&#8358;{{ number_format($item->price * $item->quantity, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- ── PRICING SUMMARY ── -->
        <div class="summary-section">
            <div class="summary-box">
                <table>
                    <tr>
                        <td class="summary-label">Subtotal</td>
                        <td class="summary-value">&#8358;{{ number_format($order->subtotal, 2) }}</td>
                    </tr>
                    @if($order->discount_amount > 0)
                        <tr class="summary-discount">
                            <td>Discount Applied</td>
                            <td class="summary-value" style="color: #0E703C;">- &#8358;{{ number_format($order->discount_amount, 2) }}</td>
                        </tr>
                    @endif
                    @if(isset($order->applied_shipping) && is_array($order->applied_shipping) && count($order->applied_shipping) > 0)
                        @foreach($order->applied_shipping as $ship)
                            <tr>
                                <td class="summary-label">Shipping ({{ $ship['name'] }})</td>
                                <td class="summary-value">&#8358;{{ number_format($ship['amount'], 2) }}</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td class="summary-label">Delivery & Handling</td>
                            <td class="summary-value">&#8358;{{ number_format($order->delivery_fee, 2) }}</td>
                        </tr>
                    @endif
                    @if(isset($order->tax_amount) && $order->tax_amount > 0)
                        <tr>
                            <td class="summary-label">Tax</td>
                            <td class="summary-value">&#8358;{{ number_format($order->tax_amount, 2) }}</td>
                        </tr>
                    @endif
                    <tr class="total-row">
                        <td class="summary-label">TOTAL AMOUNT</td>
                        <td class="summary-value">&#8358;{{ number_format($order->total_amount, 2) }}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- ── TRUST SIGNALS ── -->
        <div class="trust-strip">
            🌿 100% Organic Botanical Extracts &nbsp;&bull;&nbsp; 🚚 Nationwide Delivery &nbsp;&bull;&nbsp; 💆 Professional Skincare
        </div>

    </div>

    <!-- ── FOOTER BANNER ── -->
    <div class="footer-banner">
        <div class="footer-brand">{{ $ecommerceName }}</div>
        <div class="footer-gold">{{ $brandTagline ?? 'Luxury Skincare & Beauty Home' }}</div>
        <div style="margin-top: 8px;">
            Thank you for choosing {{ $ecommerceName }}. For exchanges or support, please reach us
            @if(!empty($whatsappNumber))
                on WhatsApp at <span class="footer-gold">{{ $whatsappNumber }}</span>
            @elseif(!empty($storeEmail))
                at <span class="footer-gold">{{ $storeEmail }}</span>
            @else
                through our store
            @endif.
        </div>
        <div class="footer-legal">
            &copy; {{ date('Y') }} {{ $ecommerceName }}. All rights reserved. This is a system-generated invoice.
        </div>
    </div>

</body>
</html>
