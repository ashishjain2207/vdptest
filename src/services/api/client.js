import {
  getAccessToken,
  refreshToken,
  ensureAccessToken,
  getPlatformAuthFromToken,
  ACCOUNT_SUSPENDED_MESSAGE,
} from '../auth/authService.js';
import { clearAuth } from '../auth/storage.js';
import { getHomeCountryCode } from '@/lib/activeCountry.js';
import { getAdminScopeCountryCode } from '@/lib/adminScopeCountry.js';
import { isRegionalMarketScopedApiPath } from '@/lib/regionalMarketApiPaths.js';
import { isMaintenanceApiBlocked } from './maintenanceApiGate.js';

/** Thrown when a market-scoped API call is made without a home country set. */
export class HomeCountryRequiredError extends Error {
  constructor() {
    super('HOME_COUNTRY_REQUIRED');
    this.name = 'HomeCountryRequiredError';
    /** @type {'HOME_COUNTRY_REQUIRED'} */
    this.code = 'HOME_COUNTRY_REQUIRED';
  }
}

/** Thrown when the API rejects the caller because their Identity account is suspended. */
export class AccountSuspendedApiError extends Error {
  constructor(message = ACCOUNT_SUSPENDED_MESSAGE) {
    super(message);
    this.name = 'AccountSuspendedApiError';
    /** @type {'ACCOUNT_SUSPENDED'} */
    this.code = 'ACCOUNT_SUSPENDED';
  }
}

/** Thrown when maintenance mode blocks outbound VDP API calls (non–platform-admin). */
export class MaintenanceApiBlockedError extends Error {
  constructor() {
    super('MAINTENANCE_MODE');
    this.name = 'MaintenanceApiBlockedError';
    /** @type {'MAINTENANCE'} */
    this.code = 'MAINTENANCE';
  }
}

// Global loading state management
const loadingCallbacks = new Set();

/**
 * Register a loading state callback
 * @param {(loading: boolean) => void} callback
 * @returns {() => void} Unregister function
 */
export function registerLoadingCallback(callback) {
  loadingCallbacks.add(callback);
  return () => {
    loadingCallbacks.delete(callback);
  };
}

/**
 * Notify all registered callbacks about loading state
 * @param {boolean} loading
 */
function notifyLoading(loading) {
  loadingCallbacks.forEach((callback) => {
    try {
      callback(loading);
    } catch (error) {
      console.error('Error in loading callback:', error);
    }
  });
}

/**
 * Fetch with Authorization header. On 401, tries refresh_token then retries once.
 * Automatically shows/hides global loader during the request.
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {boolean} [skipRetry] - if true, do not retry after refresh
 * @param {boolean} [showLoader] - if true, show global loader (default: true)
 * @returns {Promise<Response>}
 */
export async function apiRequest(url, options = {}, skipRetry = false, showLoader) {
  const { showLoader: optLoader, ...fetchOptions } = options;
  const effectiveShowLoader = showLoader !== undefined ? showLoader : (optLoader !== false);
  const token = await ensureAccessToken();

  if (isMaintenanceApiBlocked(token, url)) {
    throw new MaintenanceApiBlockedError();
  }

  let requestPathLower = '';
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';
    requestPathLower = new URL(url, origin).pathname.toLowerCase();
  } catch {
    requestPathLower = '';
  }

  if (token && requestPathLower && isRegionalMarketScopedApiPath(requestPathLower)) {
    const platformAuth = getPlatformAuthFromToken(token);
    if (!platformAuth.isPlatformStaff && !getHomeCountryCode()) {
      throw new HomeCountryRequiredError();
    }
  }

  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  let marketHeader = null;
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';
    const abs = new URL(url, origin);
    const path = abs.pathname;
    const pathLower = path.toLowerCase();
    const platformAuth = token ? getPlatformAuthFromToken(token) : {
      isPlatformAdmin: false,
      isPlatformSupport: false,
      isPlatformStaff: false,
    };
    const isPlatformAdmin = Boolean(platformAuth.isPlatformAdmin);
    const isPlatformSupport = Boolean(platformAuth.isPlatformSupport);
    const staffScope = getAdminScopeCountryCode();
    const isAdminApi = pathLower === '/api/admin' || pathLower.startsWith('/api/admin/');
    const regional = isRegionalMarketScopedApiPath(pathLower);

    if (!token) {
      marketHeader = getHomeCountryCode();
    } else if (isPlatformAdmin || isPlatformSupport) {
      if (regional || isAdminApi) {
        marketHeader = staffScope;
      } else {
        marketHeader = getHomeCountryCode();
      }
    } else {
      marketHeader = getHomeCountryCode();
    }
  } catch {
    marketHeader = getHomeCountryCode();
  }
  if (marketHeader && !headers.has('X-Country-Code')) {
    headers.set('X-Country-Code', marketHeader);
  }

  // Show loader (skip for like, repost, bookmark, comment, etc.)
  if (effectiveShowLoader) {
    notifyLoading(true);
  }

  let loaderCleared = false;
  const clearLoader = () => {
    if (effectiveShowLoader && !loaderCleared) {
      loaderCleared = true;
      notifyLoading(false);
    }
  };

  try {
    // Add timeout to prevent stuck loader
    const timeoutId = setTimeout(() => {
      if (!loaderCleared) {
        clearLoader();
      }
    }, 30000); // 30 second timeout

    let res;
    try {
      res = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });

      if (res.status === 401 && !skipRetry) {
        try {
          await refreshToken();
          const newToken = getAccessToken();
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            res = await fetch(url, { ...fetchOptions, headers, credentials: 'include' });
          }
        } catch (refreshErr) {
          if (refreshErr?.code === 'ACCOUNT_SUSPENDED') {
            throw new AccountSuspendedApiError();
          }
          // Refresh failed; return original 401 so caller can redirect to login
        }
      }

      if (res.status === 403) {
        const bodyText = await res.clone().text().catch(() => '');
        if (bodyText.includes('ACCOUNT_SUSPENDED') || bodyText.toLowerCase().includes('suspended')) {
          clearAuth();
          throw new AccountSuspendedApiError();
        }
      }
    } catch (error) {
      // Network error or fetch failed (large payloads often surface as "Failed to fetch" — callers map to user-facing text)
      const msg = String(error?.message || '').toLowerCase();
      if (!msg.includes('failed to fetch') && !msg.includes('networkerror when attempting to fetch')) {
        console.error('API request error:', error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    return res;
  } catch (error) {
    // Ensure loader is cleared on error
    clearLoader();
    throw error;
  } finally {
    // Always clear loader in finally block
    clearLoader();
  }
}

/**
 * Convenience: GET with apiRequest.
 */
export function apiGet(url, options = {}) {
  const { cache = 'no-store', ...rest } = options;
  return apiRequest(url, { ...rest, method: 'GET', cache });
}

/**
 * Convenience: POST with apiRequest.
 * @param {string} url
 * @param {Record<string, unknown> | FormData | string} [body]
 * @param {RequestInit} [options]
 */
export function apiPost(url, body, options = {}) {
  const headers = new Headers(options.headers);
  let requestBody = body;
  if (body !== null && typeof body === 'object' && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  } else if (body instanceof FormData) {
    // Do not set Content-Type for FormData - browser must set multipart/form-data with boundary
    headers.delete('Content-Type');
  } else if (typeof body === 'string') {
    requestBody = body;
  }
  return apiRequest(url, { ...options, method: 'POST', headers, body: requestBody });
}

/**
 * Convenience: DELETE with apiRequest.
 * @param {string} url
 * @param {RequestInit} [options]
 */
export function apiDelete(url, options = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' });
}

/**
 * Convenience: PATCH with apiRequest.
 * @param {string} url
 * @param {Record<string, unknown> | null} [body]
 * @param {RequestInit} [options]
 */
export function apiPatch(url, body, options = {}) {
  const headers = new Headers(options.headers);
  let requestBody = body;
  if (body !== null && typeof body === 'object') {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }
  return apiRequest(url, { ...options, method: 'PATCH', headers, body: requestBody });
}

/**
 * Convenience: PUT with apiRequest.
 * @param {string} url
 * @param {Record<string, unknown> | null} [body]
 * @param {RequestInit} [options]
 */
export function apiPut(url, body, options = {}) {
  const headers = new Headers(options.headers);
  let requestBody = body;
  if (body !== null && typeof body === 'object') {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }
  return apiRequest(url, { ...options, method: 'PUT', headers, body: requestBody });
}
