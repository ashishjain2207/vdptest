import { apiGet, apiPatch } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');
const root = `${base}/api/admin/content-moderation`;

/**
 * @param {{ status?: string, contentType?: string, page?: number, pageSize?: number }} [filters]
 */
export async function listAdminContentModerationCases(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.contentType && filters.contentType !== 'all') {
    params.set('contentType', filters.contentType);
  }
  if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.pageSize) {
    params.set('pageSize', String(filters.pageSize));
  }
  const qs = params.toString();
  const res = await apiGet(`${root}${qs ? `?${qs}` : ''}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load moderation queue');
  }
  const data = await res.json();
  return {
    items: data?.items ?? data?.Items ?? [],
    summary: data?.summary ?? data?.Summary ?? {},
    page: data?.page ?? data?.Page ?? 1,
    pageSize: data?.pageSize ?? data?.PageSize ?? 20,
    totalCount: data?.totalCount ?? data?.TotalCount ?? 0,
    totalPages: data?.totalPages ?? data?.TotalPages ?? 0,
  };
}

/** @param {string} id */
export async function getAdminContentModerationCase(id) {
  const res = await apiGet(`${root}/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load case');
  }
  return res.json();
}

/**
 * @param {string} id
 * @param {{ status: string }} body
 */
export async function patchAdminContentModerationCase(id, body) {
  const res = await apiPatch(`${root}/${encodeURIComponent(id)}`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Update failed');
  }
  return res.json();
}
