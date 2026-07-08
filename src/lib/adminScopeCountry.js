import { getHomeCountryCode, normalizeCountryCode } from '@/lib/activeCountry.js';

/** Persisted platform staff market scope (separate from immutable user home country). */
export const ADMIN_SCOPE_COUNTRY_STORAGE_KEY = 'imriva.admin.scopeCountry';

/** @deprecated Use {@link ADMIN_SCOPE_COUNTRY_STORAGE_KEY} */
export const ACTIVE_COUNTRY_CONTEXT_STORAGE_KEY = ADMIN_SCOPE_COUNTRY_STORAGE_KEY;

/** @returns {string | null} */
export function getAdminScopeCountryCode() {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return normalizeCountryCode(localStorage.getItem(ADMIN_SCOPE_COUNTRY_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Active country context for platform staff (admin/support) when previewing or creating market-scoped content.
 * This is intentionally separate from the signed-in user's immutable home country.
 * @returns {string | null}
 */
export function getActiveCountryContext() {
  return getAdminScopeCountryCode();
}

/**
 * Selected target country for admin create flows (ads, events, partners).
 * @returns {string | null}
 */
export function getSelectedCountry() {
  return getAdminScopeCountryCode();
}

/**
 * Effective market for platform-admin consumer APIs (feed, trending, etc.).
 * Uses admin scope when set; empty scope means all markets (no header / backend bypass).
 * @returns {string | null}
 */
export function resolvePlatformAdminRegionalCountryCode() {
  return getAdminScopeCountryCode();
}

/**
 * Effective market for platform-support consumer APIs.
 * Uses scope when set; empty scope means all markets (no header / backend bypass).
 * @returns {string | null}
 */
export function resolvePlatformSupportRegionalCountryCode() {
  return getAdminScopeCountryCode();
}

/**
 * @param {{ isPlatformAdmin?: boolean, isPlatformSupport?: boolean }} platformAuth
 * @returns {string | null}
 */
export function resolvePlatformStaffRegionalCountryCode(platformAuth) {
  if (platformAuth?.isPlatformAdmin) {
    return resolvePlatformAdminRegionalCountryCode();
  }
  if (platformAuth?.isPlatformSupport) {
    return resolvePlatformSupportRegionalCountryCode();
  }
  return getHomeCountryCode();
}

/**
 * Persists platform staff market preview / target country scope (not home country).
 * @param {string | null | undefined} code - ISO alpha-2 or empty to clear storage.
 */
export function setAdminScopeCountryCode(code) {
  setActiveCountryContext(code);
}

/**
 * @param {string | null | undefined} code
 */
export function setActiveCountryContext(code) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const n = normalizeCountryCode(code ?? '');
  try {
    if (!n) {
      localStorage.removeItem(ADMIN_SCOPE_COUNTRY_STORAGE_KEY);
    } else {
      localStorage.setItem(ADMIN_SCOPE_COUNTRY_STORAGE_KEY, n);
    }
    window.dispatchEvent(new CustomEvent('imriva-admin-scope-country-changed', { detail: n }));
  } catch {
    /* ignore */
  }
}

/** @param {string | null | undefined} code */
export function setSelectedCountry(code) {
  setActiveCountryContext(code);
}
