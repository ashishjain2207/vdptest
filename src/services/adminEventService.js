import { apiGet, apiPost, apiPut, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {string} [q] - Search (title, organizer, location)
 */
export async function adminListEvents(page = 1, pageSize = 20, q = '') {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q?.trim()) {
    params.set('q', q.trim());
  }
  const res = await apiGet(`${base}/api/admin/events?${params}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load events');
  }
  return res.json();
}

/** @param {string} id - Event GUID */
export async function adminGetEvent(id) {
  const res = await apiGet(`${base}/api/admin/events/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load event');
  }
  return res.json();
}

/**
 * @param {Record<string, unknown>} body - UpsertAdminEventRequest (camelCase)
 */
export async function adminCreateEvent(body) {
  const res = await apiPost(`${base}/api/admin/events`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to create event');
  }
  return res.json();
}

/** @param {string} id @param {Record<string, unknown>} body */
export async function adminUpdateEvent(id, body) {
  const res = await apiPut(`${base}/api/admin/events/${encodeURIComponent(id)}`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update event');
  }
  return res.json();
}

/** @param {string} id */
export async function adminDeleteEvent(id) {
  const res = await apiDelete(`${base}/api/admin/events/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete event');
  }
}
