import { apiGet, apiPost, apiPut, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

function normalizeAdminAdvertisementList(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const inner = raw.data ?? raw.Data ?? raw.items ?? raw.Items ?? raw.results ?? raw.Results;
  return Array.isArray(inner) ? inner : [];
}

export async function adminListAdvertisements() {
  const res = await apiGet(`${base}/api/admin/advertisements`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load advertisements');
  }
  const data = await res.json();
  return normalizeAdminAdvertisementList(data);
}

/** @param {string} id */
export async function adminGetAdvertisement(id) {
  const res = await apiGet(`${base}/api/admin/advertisements/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load advertisement');
  }
  return res.json();
}

/** @param {Record<string, unknown>} body */
export async function adminCreateAdvertisement(body) {
  const res = await apiPost(`${base}/api/admin/advertisements`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to create advertisement');
  }
  return res.json();
}

/** @param {string} id @param {Record<string, unknown>} body */
export async function adminUpdateAdvertisement(id, body) {
  const res = await apiPut(`${base}/api/admin/advertisements/${encodeURIComponent(id)}`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update advertisement');
  }
  return res.json();
}

/** @param {string} id */
export async function adminPauseAdvertisement(id) {
  const res = await apiPost(`${base}/api/admin/advertisements/${encodeURIComponent(id)}/pause`, {}, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to pause');
  }
  return res.json();
}

/** @param {string} id */
export async function adminActivateAdvertisement(id) {
  const res = await apiPost(`${base}/api/admin/advertisements/${encodeURIComponent(id)}/activate`, {}, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to activate');
  }
  return res.json();
}

/** @param {string} id */
export async function adminDeleteAdvertisement(id) {
  const res = await apiDelete(`${base}/api/admin/advertisements/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete advertisement');
  }
}
