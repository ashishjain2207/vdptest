import { API_BASE } from '@/lib/config';
import { getHomeCountryCode } from '@/lib/activeCountry.js';
import { resolvePlatformStaffRegionalCountryCode } from '@/lib/adminScopeCountry.js';
import { getAccessToken, getPlatformAuthFromToken } from '@/services/auth/authService.js';
import { isMaintenanceApiBlocked } from '@/services/api/maintenanceApiGate';

const getApiBase = () => (API_BASE || '').replace(/\/$/, '');

/** @returns {string | null} */
function resolveFeatureFlagsCountryCode() {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  if (token) {
    const auth = getPlatformAuthFromToken(token);
    if (auth.isPlatformStaff) {
      return resolvePlatformStaffRegionalCountryCode(auth);
    }
  }
  return getHomeCountryCode();
}

/**
 * Fetches feature flags from the API. Public endpoint, no auth required.
 * @returns {Promise<{ audioVideoCallEnabled: boolean, contentReportsEnabled: boolean }>}
 */
export async function getFeatureFlags() {
  if (isMaintenanceApiBlocked()) {
    return { audioVideoCallEnabled: false, contentReportsEnabled: false };
  }
  const base = getApiBase();
  const cc = resolveFeatureFlagsCountryCode();
  const qs = cc ? `?country=${encodeURIComponent(cc)}` : '';
  const url = `${base}/api/FeatureFlags${qs}`;
  try {
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) {
      return { audioVideoCallEnabled: false, contentReportsEnabled: false };
    }
    const data = await res.json();
    return {
      audioVideoCallEnabled: Boolean(data.audioVideoCallEnabled ?? data.AudioVideoCallEnabled),
      contentReportsEnabled: Boolean(data.contentReportsEnabled ?? data.ContentReportsEnabled),
    };
  } catch {
    return { audioVideoCallEnabled: false, contentReportsEnabled: false };
  }
}
