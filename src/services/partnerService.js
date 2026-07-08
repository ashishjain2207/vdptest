import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options]
 */
export async function listPartners(page = 1, pageSize = 20, options = {}) {
  const { showLoader = true } = options;
  const res = await apiGet(`${base}/api/Partners?page=${page}&pageSize=${pageSize}`, { showLoader });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load partners');
  }
  return res.json();
}

/** @param {string} handle */
export async function getPartnerByHandle(handle) {
  const res = await apiGet(`${base}/api/Partners/by-handle/${encodeURIComponent(handle)}`, { showLoader: true });
  if (!res.ok) {
    if (res.status === 404) { return null; }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load partner');
  }
  return res.json();
}

/** @param {string} id - Organization GUID */
export async function getPartnerById(id) {
  const res = await apiGet(`${base}/api/Partners/${encodeURIComponent(id)}`, { showLoader: true });
  if (!res.ok) {
    if (res.status === 404) { return null; }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load partner');
  }
  return res.json();
}

/** @param {string} organizationId - GUID; submits a join request (staff approval required). */
export async function joinPartner(organizationId) {
  const res = await apiPost(`${base}/api/Partners/${encodeURIComponent(organizationId)}/join`, {}, { showLoader: true });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to join');
  }
}

/** @param {string} organizationId */
export async function leavePartner(organizationId) {
  const res = await apiPost(`${base}/api/Partners/${encodeURIComponent(organizationId)}/leave`, {}, { showLoader: true });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to leave');
  }
}

/**
 * @param {string} organizationId
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 */
export async function getPartnerPosts(organizationId, page = 1, pageSize = 20) {
  const res = await apiGet(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/posts?page=${page}&pageSize=${pageSize}`,
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load posts');
  }
  return res.json();
}

/**
 * @param {string} organizationId
 * @param {number} [page=1]
 * @param {number} [pageSize=50]
 */
export async function getPartnerMembers(organizationId, page = 1, pageSize = 50) {
  const res = await apiGet(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/members?page=${page}&pageSize=${pageSize}`,
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load members');
  }
  return res.json();
}

/**
 * @param {string} organizationId
 * @param {{ inviteeUserId?: string, handle?: string, role?: string }} body - prefer inviteeUserId from user search; handle is optional
 */
export async function createPartnerInvite(organizationId, body) {
  const res = await apiPost(`${base}/api/Partners/${encodeURIComponent(organizationId)}/invites`, body, { showLoader: true });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to create invite');
  }
  return res.json();
}

/** @param {string} organizationId */
export async function listPartnerInvites(organizationId) {
  const res = await apiGet(`${base}/api/Partners/${encodeURIComponent(organizationId)}/invites`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load invites');
  }
  return res.json();
}

/**
 * @param {string | { token?: string, inviteId?: string }} tokenOrBody - email link token, or `{ inviteId }` for in-app
 */
export async function acceptPartnerInvite(tokenOrBody) {
  const body = typeof tokenOrBody === 'string' ? { token: tokenOrBody } : (tokenOrBody ?? {});
  const res = await apiPost(`${base}/api/Partners/invites/accept`, body, { showLoader: true });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to accept invite');
  }
}

/** @param {{ token?: string, inviteId?: string }} body */
export async function rejectPartnerInvite(body) {
  const res = await apiPost(`${base}/api/Partners/invites/reject`, body ?? {}, { showLoader: true });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to decline invite');
  }
}

/** @param {string} organizationId - GUID; pending join requests (moderator/admin). */
export async function listPartnerJoinRequests(organizationId) {
  const res = await apiGet(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/join-requests`,
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load join requests');
  }
  return res.json();
}

/** @param {string} organizationId @param {string} joinRequestId */
export async function acceptPartnerJoinRequest(organizationId, joinRequestId) {
  const res = await apiPost(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/join-requests/${encodeURIComponent(joinRequestId)}/accept`,
    {},
    { showLoader: true },
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to accept join request');
  }
}

/** @param {string} organizationId @param {string} joinRequestId */
export async function rejectPartnerJoinRequest(organizationId, joinRequestId) {
  const res = await apiPost(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/join-requests/${encodeURIComponent(joinRequestId)}/reject`,
    {},
    { showLoader: true },
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to decline join request');
  }
}

/** Pending invites for the current user (invitee), by profile email. */
export async function listMyPartnerInvites() {
  const res = await apiGet(`${base}/api/Partners/invites/me`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load invites');
  }
  return res.json();
}

/**
 * @param {string} organizationId
 * @param {string} userId
 * @param {{ role: string }} body
 */
export async function setPartnerMemberRole(organizationId, userId, body) {
  const res = await apiPatch(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}/role`,
    body,
    { showLoader: true },
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update role');
  }
}

/**
 * @param {string} organizationId
 * @param {string} userId
 * @param {{ reason?: string }} [body]
 */
export async function banPartnerMember(organizationId, userId, body = {}) {
  const res = await apiPost(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}/ban`,
    body,
    { showLoader: true },
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to ban member');
  }
}

/** @param {string} organizationId @param {string} userId */
export async function unbanPartnerMember(organizationId, userId) {
  const res = await apiDelete(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}/ban`,
    { showLoader: true },
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to unban');
  }
}

/** @param {string} organizationId @param {string} userId */
export async function removePartnerMember(organizationId, userId) {
  const res = await apiDelete(
    `${base}/api/Partners/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`,
    { showLoader: true },
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to remove member');
  }
}

/**
 * Platform admin: create partner.
 * @param {object} body - CreatePartnerAdminRequest shape
 */
/** @returns {Promise<Array<{ id: string, name: string }>>} */
export async function adminListPartnerCategories() {
  const res = await apiGet(`${base}/api/admin/partners/categories`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load categories');
  }
  return res.json();
}

/** @param {string} name */
export async function adminCreatePartnerCategory(name) {
  const res = await apiPost(`${base}/api/admin/partners/categories`, { name }, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to add category');
  }
  return res.json();
}

export async function adminCreatePartner(body) {
  const res = await apiPost(`${base}/api/admin/partners`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to create partner');
  }
  return res.json();
}

/**
 * @param {string} id - GUID
 * @param {object} body
 */
export async function adminUpdatePartner(id, body) {
  const res = await apiPut(`${base}/api/admin/partners/${encodeURIComponent(id)}`, body, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update partner');
  }
  return res.json();
}

/**
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {boolean} [includeInactive=false]
 */
/** @param {string} id - Organization GUID */
export async function adminGetPartner(id) {
  const res = await apiGet(`${base}/api/admin/partners/${encodeURIComponent(id)}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load partner');
  }
  return res.json();
}

/**
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {boolean} [includeInactive=false]
 * @param {boolean} [omitPartnerHandle=false] - When true, API omits partner handle (ad editor advertiser picklist).
 */
export async function adminListPartners(page = 1, pageSize = 20, includeInactive = false, omitPartnerHandle = false) {
  const q =
    `page=${page}&pageSize=${pageSize}&includeInactive=${includeInactive ? 'true' : 'false'}` +
    `&omitPartnerHandle=${omitPartnerHandle ? 'true' : 'false'}`;
  const res = await apiGet(`${base}/api/admin/partners?${q}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load partners');
  }
  return res.json();
}

/** Id + name only (admin event organizer combobox). */
export async function adminListPartnerOrganizerOptions() {
  const res = await apiGet(`${base}/api/admin/partners/organizer-options`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load partner organizer options');
  }
  return res.json();
}

/** @param {string} partnerId - GUID */
export async function adminTogglePartnerPremium(partnerId) {
  const res = await apiPost(`${base}/api/admin/partners/${encodeURIComponent(partnerId)}/premium/toggle`, {}, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to toggle tier');
  }
  return res.json();
}

/** @param {string} partnerId - GUID @param {string} userId - Identity user id */
export async function adminAddPartnerAdministrator(partnerId, userId) {
  const res = await apiPost(
    `${base}/api/admin/partners/${encodeURIComponent(partnerId)}/administrators`,
    { userId },
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to add partner administrator');
  }
  return res.json();
}

/** @param {string} partnerId - GUID @param {string} userId - Identity user id */
export async function adminRemovePartnerAdministrator(partnerId, userId) {
  const res = await apiDelete(
    `${base}/api/admin/partners/${encodeURIComponent(partnerId)}/administrators/${encodeURIComponent(userId)}`,
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to remove partner administrator');
  }
  return res.json();
}

/** Permanently delete a partner organization (platform admin). @param {string} partnerId - GUID */
export async function adminDeletePartner(partnerId) {
  const res = await apiDelete(`${base}/api/admin/partners/${encodeURIComponent(partnerId)}`, { showLoader: false });
  if (res.status === 404) {
    return false;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete partner');
  }
  return true;
}

