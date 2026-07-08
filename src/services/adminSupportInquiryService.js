import { apiGet, apiPatch, apiPost, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');
const root = `${base}/api/admin/support-inquiries`;

/**
 * @param {{ type?: string, status?: string }} [filters]
 */
export async function listAdminSupportInquiries(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type);
  }
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  const qs = params.toString();
  const res = await apiGet(`${root}${qs ? `?${qs}` : ''}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load support inbox');
  }
  const data = await res.json();
  return {
    items: data?.items ?? data?.Items ?? [],
    summary: data?.summary ?? data?.Summary ?? {},
  };
}

/** @param {string} id */
export async function getAdminSupportInquiry(id) {
  const res = await apiGet(`${root}/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load incident');
  }
  return res.json();
}

/**
 * @param {string} id
 * @param {{ status?: string, isRead?: boolean }} body
 */
export async function patchAdminSupportInquiry(id, body) {
  const res = await apiPatch(`${root}/${encodeURIComponent(id)}`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Update failed');
  }
  return res.json();
}

/** @param {string} id */
export async function resolveAdminSupportInquiry(id) {
  const res = await apiPost(`${root}/${encodeURIComponent(id)}/resolve`, {}, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Resolve failed');
  }
  return res.json();
}

/** @param {string} id */
export async function reopenAdminSupportInquiry(id) {
  const res = await apiPost(`${root}/${encodeURIComponent(id)}/reopen`, {}, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Reopen failed');
  }
  return res.json();
}

/** @param {string} id */
export async function deleteAdminSupportInquiry(id) {
  const res = await apiDelete(`${root}/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Delete failed');
  }
}
