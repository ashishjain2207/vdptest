import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Reads public maintenance flag (no JWT required). Used by MaintenanceModeContext and routing.
 * @returns {Promise<boolean>}
 */
export async function fetchPublicMaintenanceStatus() {
  const url = `${base}/api/public/maintenance-status`;
  const res = await fetch(url, { method: 'GET', credentials: 'omit', cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Maintenance status request failed (${res.status})`);
  }
  const data = await res.json();
  return Boolean(data.maintenanceMode ?? data.MaintenanceMode);
}
