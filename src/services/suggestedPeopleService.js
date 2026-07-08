import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Searches users by name or handle.
 * @param {string} [query] - Search query (optional; empty returns popular users)
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ excludePlatformAdmins?: boolean, countryCode?: string }} [options] - When excludePlatformAdmins and caller is platform admin, API omits VdpConnect.Admin users; countryCode filters by home country
 * @returns {Promise<{ data: Array, page: number, pageSize: number, totalCount: number, totalPages: number }>}
 */
export async function searchUsers(query = '', page = 1, pageSize = 20, options = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (query && query.trim()) {params.set('q', query.trim());}
  if (options.excludePlatformAdmins) {params.set('excludePlatformAdmins', 'true');}
  const cc = String(options.countryCode ?? '').trim().toUpperCase();
  if (cc.length === 2) {params.set('countryCode', cc);}
  const res = await apiGet(`${base}/api/Users/search?${params}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {return { data: [], page: 1, pageSize, totalCount: 0, totalPages: 0 };}
    throw new Error(`Failed to search users: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches suggested people for "people you may know" based on followers of people you follow.
 * Requires auth. Falls back to popular users when no suggestions from the follow graph.
 * @param {number} [limit=5]
 * @returns {Promise<Array<{ userId: string, displayName: string, handle: string, profileSlug: string, avatarUrl?: string, bio?: string, role?: string, company?: string, location?: string, followersCount: number, followingCount: number, isVerified: boolean, isFollowing: boolean }>>}
 */
export async function getSuggestedPeople(limit = 5) {
  const res = await apiGet(`${base}/api/Users/suggested?limit=${limit}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {return [];}
    return [];
  }
  return res.json();
}
