import { apiGet } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * @param {unknown} data
 * @param {number} [fallbackPageSize=100]
 * @returns {{ data: Array, page: number, pageSize: number, totalCount: number, totalPages: number }}
 */
export function normalizePagedConnectionsResponse(data, fallbackPageSize = 100) {
  const items = data?.data ?? data?.items ?? data?.Items ?? data?.Data ?? [];
  const page = Number(data?.page ?? data?.Page ?? 1);
  const pageSize = Number(data?.pageSize ?? data?.PageSize ?? fallbackPageSize);
  const totalCount = Number(data?.totalCount ?? data?.TotalCount ?? (Array.isArray(items) ? items.length : 0));
  const rawTotalPages = data?.totalPages ?? data?.TotalPages;
  const totalPages = rawTotalPages !== undefined && rawTotalPages !== null
    ? Number(rawTotalPages)
    : (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0);

  return {
    data: Array.isArray(items) ? items : [],
    page,
    pageSize,
    totalCount,
    totalPages,
  };
}

/**
 * Paginated connections (mutual connect) for the signed-in user.
 * @param {number} [page=1]
 * @param {number} [pageSize=100]
 * @returns {Promise<{ data: Array, page: number, pageSize: number, totalCount: number, totalPages: number }>}
 */
export async function getMyConnections(page = 1, pageSize = 100) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const res = await apiGet(`${base}/api/Connections?${params}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {
      return { data: [], page: 1, pageSize, totalCount: 0, totalPages: 0 };
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load connections');
  }
  const data = await res.json();
  return normalizePagedConnectionsResponse(data, pageSize);
}

/**
 * Loads all connections for the signed-in user by paging through the API.
 * @param {number} [pageSize=100]
 * @returns {Promise<Array>}
 */
export async function fetchAllMyConnections(pageSize = 100) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const res = await getMyConnections(page, pageSize);
    all.push(...res.data);
    totalPages = res.totalPages;
    page += 1;
  }
  return all;
}
