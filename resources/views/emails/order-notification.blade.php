<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ecommerce Notification</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333333;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .header {
            background-color: {{ $themeColor }};
            color: #ffffff;
            text-align: center;
            padding: 30px 20px;
        }
        .header h1 {
            margin: 0;
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 24px;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
            font-size: 14px;
        }
        .content p {
            margin: 0 0 20px 0;
        }
        .footer {
            background-color: #f5f5f5;
            text-align: center;
            padding: 20px;
            font-size: 11px;
            color: #888888;
            border-top: 1px solid #e8e8e8;
        }
        .btn {
            display: inline-block;
            background-color: {{ $themeColor }};
            color: #ffffff;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 13px;
            margin-top: 15px;
        }
        .summary-box {
            background-color: #fafafa;
            border: 1px dashed #dddddd;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .summary-box h3 {
            margin-top: 0;
            font-size: 13px;
            color: #555555;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div style="padding: 20px 10px;">
        <div class="container">
            <div class="header">
                <h1>FairQueen Collections</h1>
            </div>
            
            <div class="content">
                <p>{!! $bodyText !!}</p>

                <div class="summary-box">
                    <h3>Order Summary</h3>
                    <table style="width: 100%; font-size: 13px; text-align: left;">
                        <tr>
                            <td style="padding: 4px 0; color: #777;">Order Number:</td>
                            <td style="padding: 4px 0; font-weight: bold;">#{{ $order->order_number }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #777;">Amount:</td>
                            <td style="padding: 4px 0; font-weight: bold;">₦{{ number_format($order->total_amount, 2) }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #777;">Fulfillment:</td>
                            <td style="padding: 4px 0; font-weight: bold; text-transform: uppercase;">{{ $order->delivery_method }}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #777;">Payment:</td>
                            <td style="padding: 4px 0; font-weight: bold; text-transform: uppercase;">{{ $order->payment_status }}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center;">
                    <a href="{{ url('/order-tracking?order_number=' . $order->order_number . '&contact=' . urlencode($order->customer_email)) }}" class="btn">
                        Track Your Ecommerce Package
                    </a>
                </div>
            </div>

            <div class="footer">
                <p>&copy; {{ date('Y') }} FairQueen Collections. All rights reserved.</p>
                <p>Wuse II, Abuja, Nigeria | Tel: +234 800 000 0000</p>
            </div>
        </div>
    </div>
</body>
</html>
