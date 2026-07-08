import { getPlatformAuthFromToken } from '@/services/auth/authService';

/** Brief window for signed-in users to see a warning after maintenance turns on. */
export const MAINTENANCE_GRACE_PERIOD_MS = 10_000;

/**
 * @param {boolean | null} maintenanceMode
 * @param {string | null | undefined} accessToken
 * @returns {boolean}
 */
export function shouldBlockLoginDuringMaintenance(maintenanceMode, accessToken) {
  if (maintenanceMode !== true) {
    return false;
  }
  if (!accessToken) {
    return true;
  }
  return !getPlatformAuthFromToken(accessToken).isPlatformStaff;
}
