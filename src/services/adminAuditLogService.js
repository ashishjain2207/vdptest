import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');
const root = `${base}/api/admin/audit-logs`;

/**
 * @param {{ userId?: string, entityType?: string, action?: string, page?: number, pageSize?: number }} [filters]
 */
export async function listAdminAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.userId) {
    params.set('userId', filters.userId);
  }
  if (filters.entityType && filters.entityType !== 'all') {
    params.set('entityType', filters.entityType);
  }
  if (filters.action && filters.action !== 'all') {
    params.set('action', filters.action);
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
    throw new Error(err?.message || res.statusText || 'Failed to load audit logs');
  }
  const data = await res.json();
  return {
    items: data?.items ?? data?.Items ?? [],
    page: data?.page ?? data?.Page ?? 1,
    pageSize: data?.pageSize ?? data?.PageSize ?? 20,
    totalCount: data?.totalCount ?? data?.TotalCount ?? 0,
    totalPages: data?.totalPages ?? data?.TotalPages ?? 0,
  };
}

/** @param {string} id */
export async function getAdminAuditLog(id) {
  const res = await apiGet(`${root}/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load audit entry');
  }
  return res.json();
}

