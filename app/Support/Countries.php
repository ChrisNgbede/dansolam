<?php

namespace App\Support;

/**
 * Country names as the storefront stores them ("United Kingdom", "Nigeria") to ISO
 * codes, plus the UK postcode check used at checkout.
 */
class Countries
{
    /** Retired, reserved or grouping codes that ICU still names. */
    private const NOT_COUNTRIES = ['AN', 'BU', 'CS', 'DD', 'EU', 'EZ', 'FX', 'NT', 'QO', 'SU', 'TP', 'UK', 'UN', 'YD', 'YU', 'ZR', 'XA', 'XB', 'ZZ'];

    private const ALIASES = [
        'uk' => 'GB', 'great britain' => 'GB', 'england' => 'GB', 'scotland' => 'GB', 'wales' => 'GB', 'northern ireland' => 'GB',
        'usa' => 'US', 'united states of america' => 'US',
    ];

    /** ISO 3166-1 alpha-2 code for a country name or code, or null when unknown. */
    public static function code(?string $country): ?string
    {
        $key = strtolower(trim((string) $country));
        if ($key === '') return null;
        if (isset(self::ALIASES[$key])) return self::ALIASES[$key];
        $listed = self::storefrontList()[$key] ?? null;
        if ($listed) return $listed['code'];
        if (strlen($key) === 2 && in_array(strtoupper($key), self::byName(), true)) {
            return strtoupper($key);
        }
        return self::byName()[$key] ?? null;
    }

    /** International dialling code (digits only) for a country, e.g. 44 for the UK. */
    public static function callingCode(?string $country): ?string
    {
        $code = self::code($country);
        foreach (self::storefrontList() as $row) {
            if ($row['code'] === $code && $row['phonecode'] !== '') return $row['phonecode'];
        }
        return null;
    }

    /** Country list the storefront offers (resources/data/countries.json), keyed by lower-case name. */
    private static function storefrontList(): array
    {
        static $list;
        if ($list !== null) return $list;
        $rows = json_decode((string) @file_get_contents(resource_path('data/countries.json')), true) ?: [];
        $list = [];
        foreach ($rows as $row) {
            $list[strtolower($row['name'])] = ['code' => strtoupper($row['code']), 'phonecode' => (string) ($row['phonecode'] ?? '')];
        }
        return $list;
    }

    public static function isUk(?string $country): bool
    {
        return self::code($country) === 'GB';
    }

    public static function validUkPostcode(string $postcode): bool
    {
        return (bool) preg_match('/^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})$/i', trim($postcode));
    }

    /** lower-case English name => code, built from the ICU region list. */
    private static function byName(): array
    {
        static $map;
        if ($map !== null) return $map;
        $map = [];
        foreach (range('A', 'Z') as $a) {
            foreach (range('A', 'Z') as $b) {
                $code = $a . $b;
                if (in_array($code, self::NOT_COUNTRIES, true)) continue;
                $name = \Locale::getDisplayRegion('-' . $code, 'en');
                // First code wins: ICU also lists aliases (UK for GB) under the same name.
                if ($name && $name !== $code && !str_starts_with($name, 'Unknown') && !isset($map[strtolower($name)])) {
                    $map[strtolower($name)] = $code;
                }
            }
        }
        return $map;
    }
}
