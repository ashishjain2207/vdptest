import { apiRequest, apiPost, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Get comments for a post (paginated).
 * @param {string} postId - Post ID (GUID).
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options] - showLoader: false to avoid full-page loader (e.g. inline comments)
 * @returns {Promise<{ data: object[], page: number, pageSize: number, totalCount: number, totalPages: number }>}
 */
export async function getCommentsByPost(postId, page = 1, pageSize = 20, options = {}) {
  if (!postId) {return { data: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };}
  const res = await apiRequest(`${base}/api/Comments/post/${postId}?page=${page}&pageSize=${pageSize}`, { method: 'GET' }, false, options.showLoader !== false);
  if (!res.ok) {
    if (res.status === 401) {return { data: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 };}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load comments');
  }
  return res.json();
}

/**
 * Create a comment or reply. Requires login.
 * @param {{ postId: string, parentCommentId?: string|null, content: string }} dto
 * @returns {Promise<object>} Created comment
 */
export async function createComment(dto) {
  const body = {
    postId: dto.postId,
    parentCommentId: dto.parentCommentId ?? null,
    content: dto.content?.trim() ?? '',
  };
  const res = await apiPost(`${base}/api/Comments`, body, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to comment.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Failed to create comment');
  }
  return res.json();
}

/**
 * Like a comment.
 * @param {string} commentId - Comment ID (GUID).
 */
export async function likeComment(commentId) {
  const res = await apiRequest(`${base}/api/Comments/${commentId}/like`, { method: 'POST' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to like.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to like comment');
  }
}

/**
 * Pin a comment on a post. Post author only.
 * @param {string} postId - Post ID (GUID).
 * @param {string} commentId - Comment ID (GUID).
 */
export async function pinComment(postId, commentId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/comments/${commentId}/pin`, { method: 'POST' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to pin.');}
    if (res.status === 403) {throw new Error('Only the post author can pin comments.');}
    throw new Error('Failed to pin comment');
  }
}

/**
 * Unpin the comment on a post. Post author only.
 * @param {string} postId - Post ID (GUID).
 */
export async function unpinComment(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/comments/pin`, { method: 'DELETE' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to unpin.');}
    if (res.status === 403) {throw new Error('Only the post author can unpin.');}
    throw new Error('Failed to unpin comment');
  }
}

/**
 * Update a comment. Author only.
 * @param {string} commentId - Comment ID (GUID).
 * @param {{ content: string }} dto
 * @returns {Promise<object>} Updated comment
 */
export async function updateComment(commentId, dto) {
  const body = { content: (dto.content ?? '').trim() };
  const res = await apiRequest(`${base}/api/Comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to edit.');}
    if (res.status === 403) {throw new Error('You can only edit your own comments.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update comment');
  }
  return res.json();
}

/**
 * Delete a comment. Author only.
 * @param {string} commentId - Comment ID (GUID).
 */
export async function deleteComment(commentId) {
  const res = await apiRequest(`${base}/api/Comments/${commentId}`, { method: 'DELETE' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to delete.');}
    if (res.status === 403) {throw new Error('You can only delete your own comments.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete comment');
  }
}

/**
 * Unlike a comment.
 * @param {string} commentId - Comment ID (GUID).
 */
export async function unlikeComment(commentId) {
  const res = await apiDelete(`${base}/api/Comments/${commentId}/like`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to unlike.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to unlike comment');
  }
}
