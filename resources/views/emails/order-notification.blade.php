<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dansolam Notification - Order #{{ $order->order_number }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #F6F3F8;
            color: #221B2B;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }
        .wrapper {
            width: 100%;
            background-color: #F6F3F8;
            padding: 30px 15px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(93, 62, 133, 0.08);
            border: 1px solid #EADBEE;
        }
        .header {
            background: linear-gradient(135deg, #3D235C 0%, #5D3E85 50%, #EC268F 100%);
            color: #ffffff;
            text-align: center;
            padding: 36px 24px;
            position: relative;
        }
        .header h1 {
            margin: 0;
            font-family: Georgia, 'Playfair Display', serif;
            font-size: 26px;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 700;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 11px;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #E5C158;
            font-weight: 600;
        }
        .content {
            padding: 36px 30px;
            line-height: 1.65;
            font-size: 14px;
            color: #4A4054;
        }
        .message-box {
            background-color: #FAF7FC;
            border-left: 4px solid #5D3E85;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #332B3D;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-paid { background-color: #E6F7ED; color: #0E703C; }
        .badge-pending { background-color: #FFF8E6; color: #B25E00; }
        .badge-method { background-color: #F0E8F8; color: #5D3E85; }

        .section-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #5D3E85;
            margin: 24px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #F0E8F8;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 20px 0;
            font-size: 13px;
        }
        .items-table th {
            text-align: left;
            padding: 8px 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #8C7F9B;
            border-bottom: 1px solid #EADBEE;
        }
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #F3EDF7;
            vertical-align: middle;
        }
        .item-name {
            font-weight: 700;
            color: #221B2B;
        }
        .item-sub {
            font-size: 11px;
            color: #8C7F9B;
        }

        .summary-card {
            background-color: #FAF7FC;
            border: 1px solid #EADBEE;
            border-radius: 14px;
            padding: 18px 22px;
            margin: 20px 0;
        }
        .summary-table {
            width: 100%;
            font-size: 13px;
        }
        .summary-table td {
            padding: 5px 0;
        }
        .total-row td {
            padding-top: 12px;
            border-top: 1.5px solid #EADBEE;
            font-size: 16px;
            font-weight: 800;
            color: #5D3E85;
        }

        .btn-cta {
            display: block;
            width: fit-content;
            margin: 28px auto 10px auto;
            background: linear-gradient(135deg, #5D3E85 0%, #EC268F 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-align: center;
            box-shadow: 0 4px 14px rgba(236, 38, 143, 0.35);
        }

        .footer {
            background-color: #1E1528;
            color: #B5A8C4;
            text-align: center;
            padding: 28px 24px;
            font-size: 12px;
            line-height: 1.6;
        }
        .footer a {
            color: #E5C158;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Brand Header -->
            <div class="header">
                <h1>Dansolam</h1>
                <p>Beauty Home</p>
            </div>
            
            <!-- Email Body Content -->
            <div class="content">
                <div class="message-box">
                    {!! $bodyText !!}
                </div>

                <!-- Order Overview Badges -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
                    <span class="badge badge-method">Gateway: {{ strtoupper(str_replace('_', ' ', $order->payment_method)) }}</span>
                    <span class="badge {{ $order->payment_status === 'paid' ? 'badge-paid' : 'badge-pending' }}">
                        Payment: {{ strtoupper($order->payment_status) }}
                    </span>
                    <span class="badge badge-paid">Status: {{ strtoupper(str_replace('_', ' ', $order->order_status)) }}</span>
                </div>

                <!-- Itemized Products Table -->
                @if(isset($order->items) && count($order->items) > 0)
                    <div class="section-title">Order Items</div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($order->items as $item)
                                <tr>
                                    <td>
                                        <div class="item-name">{{ $item->product_name }}</div>
                                        @if(!empty($item->variant_label))
                                            <div class="item-sub">{{ $item->variant_label }}</div>
                                        @endif
                                    </td>
                                    <td style="text-align: center; color: #5D3E85; font-weight: 700;">{{ $item->quantity }}</td>
                                    <td style="text-align: right;">{{ $currency }}{{ number_format($item->price, 2) }}</td>
                                    <td style="text-align: right; font-weight: 700; color: #221B2B;">
                                        {{ $currency }}{{ number_format($item->price * $item->quantity, 2) }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif

                <!-- Pricing Breakdown -->
                <div class="summary-card">
                    <table class="summary-table">
                        <tr>
                            <td style="color: #7B6E8A;">Order Subtotal</td>
                            <td style="text-align: right; font-weight: 600;">{{ $currency }}{{ number_format($order->subtotal, 2) }}</td>
                        </tr>
                        @if($order->discount_amount > 0)
                            <tr style="color: #0E703C;">
                                <td>Discount Applied</td>
                                <td style="text-align: right; font-weight: 600;">-{{ $currency }}{{ number_format($order->discount_amount, 2) }}</td>
                            </tr>
                        @endif
                        <tr>
                            <td style="color: #7B6E8A;">Delivery & Handling</td>
                            <td style="text-align: right; font-weight: 600;">{{ $currency }}{{ number_format($order->delivery_fee, 2) }}</td>
                        </tr>
                        @if($order->tax_amount > 0)
                            <tr>
                                <td style="color: #7B6E8A;">Estimated Tax</td>
                                <td style="text-align: right; font-weight: 600;">{{ $currency }}{{ number_format($order->tax_amount, 2) }}</td>
                            </tr>
                        @endif
                        <tr class="total-row">
                            <td>Total Amount</td>
                            <td style="text-align: right;">{{ $currency }}{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                    </table>
                </div>

                <!-- Shipping Destination -->
                <div class="section-title">Delivery Information</div>
                <div style="font-size: 13px; color: #4A4054; line-height: 1.6; background-color: #FAF7FC; padding: 14px 18px; border-radius: 10px; border: 1px solid #EADBEE;">
                    <strong>Recipient:</strong> {{ $order->customer_name }} ({{ $order->customer_phone }})<br>
                    <strong>Fulfillment Method:</strong> {{ strtoupper($order->delivery_method) }}<br>
                    @if($order->delivery_method === 'delivery')
                        <strong>Address:</strong> {{ $order->delivery_address }}, {{ $order->delivery_city }}, {{ $order->delivery_state }}, {{ $order->delivery_country }}
                    @else
                        <strong>Pickup:</strong> Collect from our store
                    @endif
                </div>

                <!-- Action Button -->
                <div style="text-align: center;">
                    <a href="{{ url('/order-tracking?order_number=' . $order->order_number . '&contact=' . urlencode($order->customer_email)) }}" class="btn-cta">
                        Track Your Order Live &rarr;
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #F3EFF6;">Dansolam Beauty & Wellness Home</p>
                <p style="margin: 0 0 12px 0; font-size: 11px;">Exquisite Formulas & Professional Care</p>
                <p style="margin: 0; font-size: 10px; color: #8A7B9B;">
                    &copy; {{ date('Y') }} Dansolam. All rights reserved. | Need assistance? Reach our customer concierge anytime.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
