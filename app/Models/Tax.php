<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'rate',
        'type',
        'applicable_areas',
        'sales_channel',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rate' => 'decimal:2',
    ];

    /**
     * Check if this tax applies to a given state/country.
     */
    public function appliesToArea($state = null, $country = null): bool
    {
        if (!$this->is_active) return false;

        $areas = $this->applicable_areas;

        // If no areas defined or set to 'all', it applies everywhere
        if (empty($areas) || $areas === 'all') return true;

        // Decode the JSON array
        $decoded = json_decode($areas, true);
        if (!is_array($decoded) || empty($decoded)) return true;

        // Check if state or country is in the areas list (case-insensitive)
        $normalizedAreas = array_map('strtolower', $decoded);

        if ($state && in_array(strtolower($state), $normalizedAreas)) return true;
        if ($country && in_array(strtolower($country), $normalizedAreas)) return true;

        return false;
    }
}
