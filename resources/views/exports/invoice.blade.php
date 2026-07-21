<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $order->order_number }}</title>
    <style>
        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            background: #fff;
        }
        .invoice-header {
            width: 100%;
            margin-bottom: 20px;
        }
        .invoice-logo {
            font-size: 24px;
            font-weight: bold;
            color: {{ $themeColor }};
            text-transform: uppercase;
        }
        .invoice-title {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            color: #777;
        }
        .invoice-details {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        .invoice-details td {
            padding: 5px 0;
            vertical-align: top;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #f5f5f5;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
        }
        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        .total-box {
            float: right;
            width: 250px;
            margin-bottom: 30px;
        }
        .total-box table {
            width: 100%;
        }
        .total-box td {
            padding: 4px 0;
        }
        .footer {
            clear: both;
            text-align: center;
            padding-top: 50px;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="invoice-box">
        <table class="invoice-header" style="width: 100%;">
            <tr>
                <td class="invoice-logo" style="vertical-align: middle;">
                    @if(!empty($logoUrl))
                        <img src="{{ $logoUrl }}" alt="{{ $ecommerceName }}" style="max-height: 45px; max-width: 180px; object-fit: contain;" />
                    @else
                        {{ $ecommerceName }}
                    @endif
                </td>
                <td class="invoice-title" style="vertical-align: middle;">
                    Invoice / Receipt
                </td>
            </tr>
        </table>

        <table class="invoice-details" style="width: 100%;">
            <tr>
                <td style="width: 50%;">
                    <strong>Billed From:</strong><br>
                    {{ $ecommerceName }}<br>
                    {{ $storeAddress }}<br>
                    Abuja, Nigeria<br>
                    WhatsApp: {{ $whatsappNumber }}
                </td>
                <td style="text-align: right; width: 50%;">
                    <strong>Invoice ID:</strong> #{{ $order->order_number }}<br>
                    <strong>Created Date:</strong> {{ $order->created_at->format('M d, Y') }}<br>
                    <strong>Payment Method:</strong> {{ strtoupper($order->payment_method) }}<br>
                    <strong>Payment Status:</strong> {{ strtoupper($order->payment_status) }}
                </td>
            </tr>
            <tr>
                <td style="padding-top: 15px;">
                    <strong>Billed To:</strong><br>
                    {{ $order->customer_name }}<br>
                    {{ $order->customer_email }}<br>
                    {{ $order->customer_phone }}
                </td>
                <td style="text-align: right; padding-top: 15px;">
                    <strong>Shipping Details:</strong><br>
                    Delivery method: {{ strtoupper($order->delivery_method) }}<br>
                    @if($order->delivery_method === 'delivery')
                        {{ $order->delivery_address }}, {{ $order->delivery_city }}, {{ $order->delivery_state }}
                    @else
                        Store pickup at Abuja Wuse II branch
                    @endif
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th style="text-align: center;">Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              @foreach($order->items as $item)
                <tr>
                  <td>
                    <strong>{{ $item->product_name }}</strong><br>
                    <span style="font-size: 10px; color: #777;">{{ $item->variant_label }}</span>
                  </td>
                  <td style="text-align: center;">&#8358;{{ number_format($item->price, 2) }}</td>
                  <td style="text-align: center;">{{ $item->quantity }}</td>
                  <td style="text-align: right;">&#8358;{{ number_format($item->price * $item->quantity, 2) }}</td>
                </tr>
              @endforeach
            </tbody>
        </table>

        <div class="total-box">
            <table>
                <tr>
                    <td style="color: #777;">Subtotal:</td>
                    <td style="text-align: right;">&#8358;{{ number_format($order->subtotal, 2) }}</td>
                </tr>
                @if($order->discount_amount > 0)
                    <tr style="color: green;">
                        <td>Discount Applied:</td>
                        <td style="text-align: right;">- &#8358;{{ number_format($order->discount_amount, 2) }}</td>
                    </tr>
                @endif
                @if($order->applied_shipping && count($order->applied_shipping) > 0)
                    @foreach($order->applied_shipping as $ship)
                        <tr>
                            <td style="color: #777; font-size: 11px;">Shipping ({{ $ship['name'] }}):</td>
                            <td style="text-align: right; font-size: 11px;">&#8358;{{ number_format($ship['amount'], 2) }}</td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td style="color: #777;">Shipping:</td>
                        <td style="text-align: right;">&#8358;{{ number_format($order->delivery_fee, 2) }}</td>
                    </tr>
                @endif
                @if($order->tax_amount > 0)
                    <tr>
                        <td style="color: #777;">Taxes:</td>
                        <td style="text-align: right;">&#8358;{{ number_format($order->tax_amount, 2) }}</td>
                    </tr>
                @endif
                <tr style="border-top: 1px solid #ccc; font-weight: bold; font-size: 14px;">
                    <td style="padding-top: 10px; color: {{ $themeColor }};">Total Paid:</td>
                    <td style="padding-top: 10px; text-align: right; color: {{ $themeColor }};">&#8358;{{ number_format($order->total_amount, 2) }}</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>Thank you for your business. For exchange terms or support, reach us on WhatsApp at {{ $whatsappNumber }}.</p>
            <p>Dansolam - Abuja Branch</p>
        </div>
    </div>
</body>
</html>
