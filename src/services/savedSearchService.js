import { apiGet, apiPost, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Fetches saved searches for the current user.
 * @param {number} [limit=20]
 * @returns {Promise<Array<{ id: string, query: string, createdAt: string }>>}
 */
export async function getSavedSearches(limit = 20) {
  const url = `${base}/api/SavedSearches?limit=${limit}`;
  const res = await apiGet(url, { showLoader: false });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

/**
 * Saves a search for the current user. Call when user performs a search.
 * @param {string} query - The search query to save
 * @returns {Promise<{ id: string, query: string, createdAt: string } | null>}
 */
export async function saveSearch(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) {return null;}

  const url = `${base}/api/SavedSearches`;
  const res = await apiPost(url, { query: trimmed }, { showLoader: false });

  if (!res.ok) {return null;}
  return res.json();
}

/**
 * Deletes a saved search.
 * @param {string} id - The saved search ID
 * @returns {Promise<boolean>} - True if deleted
 */
export async function deleteSavedSearch(id) {
  const url = `${base}/api/SavedSearches/${id}`;
  const res = await apiDelete(url, { showLoader: false });
  return res.ok;
}

import { formatRelativeTimeAgo } from '@/lib/displayLabels';

/**
 * Formats a date for display (e.g. "2 days ago" / "vor 2 Tagen").
 * @param {string} isoDate
 * @param {'EN' | 'DE'} [language]
 * @returns {string}
 */
export function formatSavedSearchTimestamp(isoDate, language = 'EN') {
  return formatRelativeTimeAgo(isoDate, language === 'DE' ? 'DE' : 'EN');
}
