const STORAGE_KEY = 'imriva.vdp.homeCountry';
const LEGACY_STORAGE_KEY = 'imriva.vdp.activeCountry';

/**
 * @param {unknown} raw
 * @returns {string | null} Two-letter A–Z or null.
 */
export function normalizeCountryCode(raw) {
  if (raw === null || raw === undefined || typeof raw !== 'string') {
    return null;
  }
  const s = raw.trim().toUpperCase();
  if (s.length !== 2 || !/^[A-Z]{2}$/.test(s)) {
    return null;
  }
  return s;
}

/** @returns {string | null} */
export function getHomeCountryCode() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    let v = normalizeCountryCode(localStorage.getItem(STORAGE_KEY));
    if (!v) {
      const legacy = normalizeCountryCode(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        v = legacy;
      }
    }
    return v;
  } catch {
    return null;
  }
}

/**
 * Persists home market locally (matches server UserSettings.HomeCountryCode; sent as X-Country-Code for consumer API calls).
 * @param {string | null | undefined} code - ISO alpha-2 or empty to clear.
 */
export function setHomeCountryCode(code) {
  const n = normalizeCountryCode(code ?? '');
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    if (!n) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, n);
    }
    window.dispatchEvent(new CustomEvent('imriva-home-country-changed', { detail: n }));
    window.dispatchEvent(new CustomEvent('imriva-active-country-changed', { detail: n }));
  } catch {
    /* ignore quota / private mode */
  }
}
