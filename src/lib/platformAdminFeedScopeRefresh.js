import { useEffect } from 'react';
import { getAccessToken, getPlatformAuthFromToken } from '@/services/auth/authService.js';

/** @returns {boolean} */
export function shouldRefreshFeedOnAdminScopeChange() {
  return shouldRefreshFeedOnStaffScopeChange();
}

/** @returns {boolean} */
export function shouldRefreshFeedOnStaffScopeChange() {
  const token = getAccessToken();
  if (!token) {
    return false;
  }
  const auth = getPlatformAuthFromToken(token);
  return Boolean(auth.isPlatformAdmin || auth.isPlatformSupport);
}

/**
 * Refetch consumer feed when platform staff changes market scope.
 * @param {() => void} onRefresh
 * @returns {() => void} unsubscribe
 */
export function subscribeAdminScopeFeedRefresh(onRefresh) {
  const handler = () => {
    if (shouldRefreshFeedOnStaffScopeChange()) {
      onRefresh();
    }
  };
  window.addEventListener('imriva-admin-scope-country-changed', handler);
  return () => window.removeEventListener('imriva-admin-scope-country-changed', handler);
}

/**
 * Reload market-scoped consumer pages when platform staff changes country scope.
 * @param {() => void} onRefresh
 */
export function useStaffScopeContentRefresh(onRefresh) {
  useEffect(() => subscribeAdminScopeFeedRefresh(onRefresh), [onRefresh]);
}
