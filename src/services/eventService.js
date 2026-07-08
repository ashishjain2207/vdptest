import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * @param {{ scope?: 'upcoming' | 'past', page?: number, pageSize?: number }} [params]
 */
export async function listPublicEvents(params = {}) {
  const { scope = 'upcoming', page = 1, pageSize = 20 } = params;
  const q = new URLSearchParams({
    scope,
    page: String(page),
    pageSize: String(pageSize),
  });
  const res = await apiGet(`${base}/api/Events?${q}`, { showLoader: true });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load events');
  }
  return res.json();
}

/** @param {string} id - Event GUID */
export async function getPublicEvent(id) {
  const res = await apiGet(`${base}/api/Events/${encodeURIComponent(id)}`, { showLoader: true });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load event');
  }
  return res.json();
}
