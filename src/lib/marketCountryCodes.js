/**
 * Country catalog for pickers (full ISO alpha-2) and feature-level live-market checks.
 */

/** Markets with full product availability — use at feature level, not in country pickers. */
export const LIVE_MARKET_COUNTRY_CODES = [
  'US', 'DE', 'GB', 'FR', 'CH', 'AT', 'NL', 'BE', 'ES', 'IT', 'IE', 'PT', 'PL', 'SE', 'NO', 'DK', 'FI',
  'CA', 'AU', 'NZ', 'IN', 'JP', 'SG',
];

/** @deprecated Use LIVE_MARKET_COUNTRY_CODES */
export const MARKET_COUNTRY_CODES = LIVE_MARKET_COUNTRY_CODES;

/** Shown in country pickers before the user types a search query. */
export const POPULAR_COUNTRY_CODES = LIVE_MARKET_COUNTRY_CODES;

/** @deprecated Use POPULAR_COUNTRY_CODES */
export const PRIORITY_COUNTRY_CODES = POPULAR_COUNTRY_CODES;

const LIVE_SET = new Set(LIVE_MARKET_COUNTRY_CODES);

/**
 * Static fallback when Intl.supportedValuesOf('region') is unavailable (SSR/tests).
 * @type {readonly string[]}
 */
const FALLBACK_ISO_COUNTRY_CODES = Object.freeze([
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW',
]);

/** @returns {string[]} Sorted unique ISO alpha-2 codes. */
export function getAllIsoCountryCodes() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      const regions = Intl.supportedValuesOf('region');
      const codes = regions.filter((r) => typeof r === 'string' && /^[A-Z]{2}$/.test(r));
      if (codes.length > 50) {
        return [...new Set(codes)].sort();
      }
    }
  } catch {
    // fall through
  }
  return [...FALLBACK_ISO_COUNTRY_CODES];
}

/**
 * Localized display name for an ISO alpha-2 code (e.g. US → United States).
 * @param {string | null | undefined} code
 * @param {'EN' | 'DE'} language
 */
export function getMarketCountryLabel(code, language) {
  const c = String(code ?? '').trim().toUpperCase();
  if (c.length !== 2) {
    return c || '';
  }
  const locale = language === 'DE' ? 'de' : 'en';
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      return new Intl.DisplayNames([locale], { type: 'region' }).of(c) || c;
    }
  } catch {
    // fall through
  }
  return c;
}

/** Feature-level: whether the product is fully live in this market (not used in pickers). */
/** @param {string | null | undefined} code @returns {'live' | 'coming_soon'} */
export function getCountryMarketStatus(code) {
  const c = String(code ?? '').trim().toUpperCase();
  if (c.length !== 2) {
    return 'coming_soon';
  }
  return LIVE_SET.has(c) ? 'live' : 'coming_soon';
}

/** @param {string | null | undefined} code */
export function isLiveMarketCountry(code) {
  return getCountryMarketStatus(code) === 'live';
}

/** @typedef {{ code: string, label: string }} CountryPickerEntry */

/**
 * @param {'EN' | 'DE'} language
 * @returns {CountryPickerEntry[]}
 */
export function getPopularCountriesForPicker(language) {
  return POPULAR_COUNTRY_CODES.map((code) => ({
    code,
    label: getMarketCountryLabel(code, language),
  }));
}

/**
 * All ISO countries for search, sorted alphabetically by localized label.
 * @param {'EN' | 'DE'} language
 * @returns {CountryPickerEntry[]}
 */
export function getAllCountriesForPicker(language) {
  const locale = language === 'DE' ? 'de' : 'en';
  return getAllIsoCountryCodes()
    .map((code) => ({
      code,
      label: getMarketCountryLabel(code, language),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }));
}

/**
 * @param {CountryPickerEntry[]} catalog
 * @param {string} query
 * @param {{ maxResults?: number }} [opts]
 * @returns {CountryPickerEntry[]}
 */
export function filterCountryCatalog(catalog, query, opts = {}) {
  const { maxResults = 50 } = opts;
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) {
    return catalog.slice(0, maxResults);
  }
  const filtered = catalog.filter((entry) => {
    const code = entry.code.toLowerCase();
    const label = entry.label.toLowerCase();
    return label.includes(q) || code.includes(q) || code.startsWith(q);
  });
  return filtered.slice(0, maxResults);
}

/**
 * @param {'EN' | 'DE'} language
 * @returns {{ code: string, label: string }[]}
 */
export function getMarketCountriesSorted(language) {
  return getAllCountriesForPicker(language);
}

/**
 * Display string for a selected country code.
 * @param {string | null | undefined} code
 * @param {'EN' | 'DE'} language
 */
export function formatCountryOptionLabel(code, language) {
  const c = String(code ?? '').trim().toUpperCase();
  if (c.length !== 2) {
    return '';
  }
  const name = getMarketCountryLabel(c, language);
  return name === c ? c : `${name} (${c})`;
}
