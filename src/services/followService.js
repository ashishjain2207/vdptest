import { apiGet, apiPost, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Fetches paginated followers (users who follow the given user).
 * @param {string} userId - The user ID whose followers to get
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @returns {Promise<{ data: Array, page: number, pageSize: number, totalCount: number, totalPages: number }>}
 */
export async function getFollowers(userId, page = 1, pageSize = 20) {
  const res = await apiGet(
    `${base}/api/follows/${encodeURIComponent(userId)}/followers?page=${page}&pageSize=${pageSize}`,
    { showLoader: false },
  );
  if (!res.ok) {
    if (res.status === 404) {return { data: [], page: 1, pageSize, totalCount: 0, totalPages: 0 };}
    throw new Error(`Failed to fetch followers: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches paginated following (users that the given user follows).
 * @param {string} userId - The user ID whose following list to get
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @returns {Promise<{ data: Array, page: number, pageSize: number, totalCount: number, totalPages: number }>}
 */
export async function getFollowing(userId, page = 1, pageSize = 20) {
  const res = await apiGet(
    `${base}/api/follows/${encodeURIComponent(userId)}/following?page=${page}&pageSize=${pageSize}`,
    { showLoader: false },
  );
  if (!res.ok) {
    if (res.status === 404) {return { data: [], page: 1, pageSize, totalCount: 0, totalPages: 0 };}
    throw new Error(`Failed to fetch following: ${res.status}`);
  }
  return res.json();
}

/**
 * Follows a user.
 * @param {string} targetUserId - The user ID to follow
 * @returns {Promise<boolean>} True if successful
 */
export async function followUser(targetUserId) {
  const res = await apiPost(
    `${base}/api/follows/${encodeURIComponent(targetUserId)}`,
    null,
    { showLoader: false },
  );
  return res.ok || res.status === 204;
}

/**
 * Unfollows a user.
 * @param {string} targetUserId - The user ID to unfollow
 * @returns {Promise<boolean>} True if successful
 */
export async function unfollowUser(targetUserId) {
  const res = await apiDelete(
    `${base}/api/follows/${encodeURIComponent(targetUserId)}`,
    { showLoader: false },
  );
  return res.ok || res.status === 204;
}
