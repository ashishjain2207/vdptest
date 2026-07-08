import { getAccessToken, getPlatformAuthFromToken } from '@/services/auth/authService';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';
import { buildOnboardingRedirectUrl } from '@/lib/homeCountryOnboarding';

/**
 * Destination after login / OAuth. During maintenance, non–platform-staff go straight to
 * `/maintenance` so they never hit app routes (e.g. `/posts`) that trigger home-country toasts.
 *
 * @param {{ maintenanceMode: boolean | null, accessToken?: string | null, intendedPath?: string, hasHomeCountry?: boolean }} opts
 * @returns {string}
 */
export function resolvePostLoginRedirect({ maintenanceMode, accessToken, intendedPath = '/', hasHomeCountry = true }) {
  const fallback =
    intendedPath && String(intendedPath).trim() && intendedPath !== '/login'
      ? intendedPath
      : '/';

  const token = accessToken ?? (typeof window !== 'undefined' ? getAccessToken() : null);
  const platformAuth = token ? getPlatformAuthFromToken(token) : null;

  if (maintenanceMode !== true) {
    if (
      platformAuth?.isPlatformSupport
      && !platformAuth?.isPlatformAdmin
      && (fallback === '/' || fallback === '/posts')
    ) {
      return PLATFORM_SUPPORT_INBOX_PATH;
    }
    if (!hasHomeCountry && token && !platformAuth?.isPlatformStaff) {
      return buildOnboardingRedirectUrl(fallback);
    }
    return fallback;
  }

  if (!token || platformAuth?.isPlatformStaff) {
    if (
      platformAuth?.isPlatformSupport
      && !platformAuth?.isPlatformAdmin
      && (fallback === '/' || fallback === '/posts')
    ) {
      return PLATFORM_SUPPORT_INBOX_PATH;
    }
    return fallback;
  }

  return '/maintenance';
}

/**
 * Resolves maintenance flag for post-login redirect when context may still be loading (null).
 *
 * @param {boolean | null} maintenanceMode
 * @param {() => Promise<boolean>} refresh
 * @returns {Promise<boolean>}
 */
export async function maintenanceModeForPostLoginRedirect(maintenanceMode, refresh) {
  if (maintenanceMode !== null) {
    return maintenanceMode;
  }
  return refresh();
}
