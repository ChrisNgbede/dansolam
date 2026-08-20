import { Country, State } from 'country-state-city';

// Cache all countries worldwide sorted alphabetically
export const COUNTRIES = Country.getAllCountries().map(c => ({
  code: c.isoCode,
  name: c.name,
  flag: c.flag,
  phonecode: c.phonecode,
  currency: c.currency
})).sort((a, b) => a.name.localeCompare(b.name));

// Fast lookup map for Country by Name and Code
const COUNTRY_BY_NAME = new Map();
const COUNTRY_BY_CODE = new Map();

COUNTRIES.forEach(c => {
  COUNTRY_BY_NAME.set(c.name.toLowerCase(), c);
  COUNTRY_BY_CODE.set(c.code.toUpperCase(), c);
});

// Cache for states by country code or name
const STATES_CACHE = new Map();

/**
 * Get all states/provinces/regions for any country in the world.
 * Supports country name (e.g. "Nigeria", "United States") or ISO code (e.g. "NG", "US").
 */
export const getStates = (countryIdentifier) => {
  if (!countryIdentifier) return [];

  const key = String(countryIdentifier).trim();
  if (STATES_CACHE.has(key)) {
    return STATES_CACHE.get(key);
  }

  // Resolve ISO code
  let isoCode = '';
  if (key.length === 2) {
    isoCode = key.toUpperCase();
  } else {
    const matchedCountry = COUNTRY_BY_NAME.get(key.toLowerCase());
    if (matchedCountry) {
      isoCode = matchedCountry.code;
    }
  }

  if (!isoCode) {
    // If not found, check common variations
    if (key.toLowerCase() === 'usa' || key.toLowerCase() === 'united states of america') isoCode = 'US';
    else if (key.toLowerCase() === 'uk' || key.toLowerCase() === 'great britain') isoCode = 'GB';
  }

  let states = [];
  if (isoCode) {
    const rawStates = State.getStatesOfCountry(isoCode) || [];
    // Clean up state names (remove "State", "Province", redundant suffixes where appropriate)
    states = rawStates.map(s => {
      let name = s.name;
      // For Nigerian states, ensure cleaner labels
      if (isoCode === 'NG') {
        if (name === 'Federal Capital Territory') return 'Abuja (FCT)';
        name = name.replace(/\s+State$/i, '');
      }
      return name;
    }).sort((a, b) => a.localeCompare(b));
  }

  // Fallback if country has no states in library
  if (states.length === 0) {
    states = ['All Regions / Nationwide'];
  }

  STATES_CACHE.set(key, states);
  return states;
};

/**
 * Proxy-like object for backwards-compatibility with STATES_BY_COUNTRY[countryName]
 */
export const STATES_BY_COUNTRY = new Proxy({}, {
  get: (target, prop) => {
    if (typeof prop === 'string') {
      return getStates(prop);
    }
    return [];
  }
});
