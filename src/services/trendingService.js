import { apiRequest } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Fetches trending hashtags from the API (no global loader).
 * @param {number} [limit=10]
 * @param {number} [periodDays=7]
 * @returns {Promise<Array<{ hashtagId: string, tag: string, postsCount: number, percentageChange: number }>>}
 */
export async function getTrendingHashtags(limit = 10, periodDays = 7) {
  const url = `${base}/api/Trendings?limit=${limit}&periodDays=${periodDays}`;
  const res = await apiRequest(url, { method: 'GET' }, false, false);
  if (!res.ok) {
    return [];
  }
  return res.json();
}
