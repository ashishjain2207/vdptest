import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Platform admin dashboard: aggregated SQL stats + merged recent activity.
 * @returns {Promise<{
 *   stats: {
 *     totalPartners: number,
 *     premiumPartners: number,
 *     totalEvents: number,
 *     upcomingEvents: number,
 *     totalUsers: number,
 *     activeUsersLast7Days: number,
 *     postsLast7Days: number,
 *     activeAdvertisements: number,
 *   },
 *   recentActivity: Array<{
 *     activityType: string,
 *     messageEn: string,
 *     messageDe: string,
 *     occurredAtUtc: string,
 *   }>,
 * }>}
 */
export async function getAdminDashboard() {
  const res = await apiGet(`${base}/api/admin/dashboard`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load admin dashboard');
  }
  return res.json();
}
