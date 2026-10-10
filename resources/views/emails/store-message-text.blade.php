{!! $heading !!}

@foreach ($paragraphs as $paragraph)
{!! $paragraph !!}

@endforeach
@if ($code)
Your verification code: {!! $code !!}

@endif
@foreach ($details as $label => $value)
{!! $label !!}: {!! $value !!}
@endforeach
@if ($buttonText && $buttonUrl)

{!! $buttonText !!}: {!! $buttonUrl !!}
@endif

With love,
{!! $storeName !!}
{!! url('/') !!}
