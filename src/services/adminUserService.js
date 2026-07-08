import { apiGet, apiPost, apiPut } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');
const adminUsersBase = `${base}/api/admin/users`;

/**
 * @param {string} [query]
 * @param {number} [page]
 * @param {number} [pageSize]
 * @param {{ excludePlatformAdmins?: boolean }} [options]
 */
export async function searchAdminUsers(query = '', page = 1, pageSize = 20, options = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (query?.trim()) {
    params.set('q', query.trim());
  }
  if (options.excludePlatformAdmins) {
    params.set('excludePlatformAdmins', 'true');
  }
  const res = await apiGet(`${adminUsersBase}?${params}`, { showLoader: false });
  if (!res.ok) {
    throw new Error(`Failed to load users: ${res.status}`);
  }
  return res.json();
}

/** @returns {Promise<Array<{ name: string, label: string }>>} */
export async function getAssignablePlatformRoles() {
  const res = await apiGet(`${adminUsersBase}/assignable-roles`, { showLoader: false });
  if (!res.ok) {
    throw new Error(`Failed to load roles: ${res.status}`);
  }
  return res.json();
}

export async function suspendAdminUser(userId) {
  const res = await apiPost(`${adminUsersBase}/${encodeURIComponent(userId)}/suspend`, null, { showLoader: false });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Suspend failed: ${res.status}`);
  }
}

export async function unsuspendAdminUser(userId) {
  const res = await apiPost(`${adminUsersBase}/${encodeURIComponent(userId)}/unsuspend`, null, { showLoader: false });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Unsuspend failed: ${res.status}`);
  }
}

export async function setAdminUserPlatformRole(userId, roleName) {
  const res = await apiPut(
    `${adminUsersBase}/${encodeURIComponent(userId)}/platform-role`,
    { roleName },
    { showLoader: false },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Role update failed: ${res.status}`);
  }
}
