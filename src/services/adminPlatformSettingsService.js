import { apiGet, apiPut } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * @returns {Promise<{ maintenanceMode: boolean, supportEmail: string, adminNotificationEmail: string }>}
 */
export async function getAdminPlatformSettings() {
  const res = await apiGet(`${base}/api/admin/platform-settings`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load settings');
  }
  return res.json();
}

/**
 * @param {{ maintenanceMode: boolean, supportEmail: string, adminNotificationEmail: string }} body
 */
export async function updateAdminPlatformSettings(body) {
  const res = await apiPut(`${base}/api/admin/platform-settings`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to save settings');
  }
  return res.json();
}
