import { getAccessToken, getPlatformAuthFromToken } from '../auth/authService.js';

/** @type {boolean | null} mirrors MaintenanceModeContext — null unknown */
let publicMaintenanceMode = null;

const PUBLIC_AUTH_PATHS = new Set([
  '/api/register',
  '/api-identity/api/register',
]);

/** Anonymous public API calls that must work during maintenance (support form, etc.). */
const PUBLIC_MAINTENANCE_API_PATH_SUFFIXES = [
  '/api/public/support-inquiries',
];

/**
 * Called when public maintenance status is refreshed so apiRequest can block without React.
 * @param {boolean | null} mode
 */
export function setPublicMaintenanceMode(mode) {
  publicMaintenanceMode = mode;
}

function getRequestPath(url) {
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';
    return new URL(String(url ?? ''), origin).pathname;
  } catch {
    return '';
  }
}

function isPublicMaintenanceExemptRequest(url) {
  const path = getRequestPath(url);
  if (PUBLIC_AUTH_PATHS.has(path)) {
    return true;
  }

  return PUBLIC_MAINTENANCE_API_PATH_SUFFIXES.some((suffix) => path.endsWith(suffix));
}

/**
 * True when maintenance is on and the current session is not a platform admin (VDP Connect admin JWT).
 * Identity/userinfo calls are unaffected; all uses of apiRequest / apiGet / etc. should short-circuit.
 * @param {string | null | undefined} [accessToken] - Optional freshly resolved token; avoids rejecting admins before refresh.
 * @param {string} [url] - Request URL, used to allow unauthenticated public auth endpoints during maintenance.
 */
export function isMaintenanceApiBlocked(accessToken, url) {
  if (publicMaintenanceMode !== true) {
    return false;
  }
  if (isPublicMaintenanceExemptRequest(url)) {
    return false;
  }
  const token = accessToken ?? getAccessToken();
  if (!token) {
    return true;
  }
  return !getPlatformAuthFromToken(token).isPlatformStaff;
}
