<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F3F8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#221B2B;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F3F8; padding:30px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border:1px solid #EADBEE; border-radius:20px; overflow:hidden;">
                    <tr>
                        <td style="background:#5D3E85; background:linear-gradient(135deg, #3D235C 0%, #5D3E85 55%, #EC268F 100%); padding:32px 24px; text-align:center;">
                            <div style="font-family:Georgia, serif; font-size:26px; font-weight:700; letter-spacing:1px; color:#ffffff;">Dansolam</div>
                            <div style="margin-top:4px; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#E5C158; font-weight:600;">Beauty Home</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:34px 30px 10px 30px;">
                            <h1 style="margin:0 0 18px 0; font-size:21px; line-height:1.3; color:#221B2B;">{{ $heading }}</h1>
                            @foreach ($paragraphs as $paragraph)
                                <p style="margin:0 0 14px 0; font-size:14px; line-height:1.65; color:#4A4054;">{!! nl2br(e($paragraph)) !!}</p>
                            @endforeach

                            @if ($code)
                                <div style="margin:22px 0; padding:18px; text-align:center; background-color:#FAF7FC; border:1px solid #EADBEE; border-radius:14px;">
                                    <div style="font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#7B6E8A;">Your verification code</div>
                                    <div style="margin-top:8px; font-family:'Courier New', monospace; font-size:30px; font-weight:800; letter-spacing:8px; color:#5D3E85;">{{ $code }}</div>
                                </div>
                            @endif

                            @if (!empty($details))
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 8px 0; background-color:#FAF7FC; border:1px solid #EADBEE; border-radius:14px;">
                                    @foreach ($details as $label => $value)
                                        <tr>
                                            <td style="padding:10px 16px; font-size:12px; color:#7B6E8A; vertical-align:top; width:38%; {{ $loop->last ? '' : 'border-bottom:1px solid #F0E8F8;' }}">{{ $label }}</td>
                                            <td style="padding:10px 16px; font-size:13px; color:#221B2B; font-weight:600; {{ $loop->last ? '' : 'border-bottom:1px solid #F0E8F8;' }}">{!! nl2br(e($value)) !!}</td>
                                        </tr>
                                    @endforeach
                                </table>
                            @endif

                            @if ($buttonText && $buttonUrl)
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto 12px auto;">
                                    <tr>
                                        <td style="border-radius:9999px; background:#EC268F; background:linear-gradient(135deg, #5D3E85 0%, #EC268F 100%);">
                                            <a href="{{ $buttonUrl }}" style="display:inline-block; padding:14px 30px; font-size:13px; font-weight:700; color:#ffffff; text-decoration:none;">{{ $buttonText }}</a>
                                        </td>
                                    </tr>
                                </table>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 30px 30px 30px; font-size:13px; color:#7B6E8A;">With love,<br><strong style="color:#5D3E85;">{{ $storeName }}</strong></td>
                    </tr>
                    <tr>
                        <td style="background-color:#1E1528; padding:22px 24px; text-align:center; font-size:11px; line-height:1.6; color:#B5A8C4;">
                            <a href="{{ url('/') }}" style="color:#E5C158; text-decoration:none;">{{ preg_replace('#^https?://#', '', url('/')) }}</a><br>
                            &copy; {{ date('Y') }} Dansolam. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
