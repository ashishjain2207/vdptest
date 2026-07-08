/**
 * Canonical path builders for URL-as-source-of-truth navigation.
 * Use these with navigate() / Link instead of hardcoding strings.
 */

/** @param {string} postId */
export function postPath(postId) {
  return `/posts/${encodeURIComponent(postId)}`;
}

/**
 * Post-attached media viewer (images from a single post).
 * @param {string} postId
 * @param {number} [mediaIndex] omit or 0 for base media route
 */
export function postMediaPath(postId, mediaIndex) {
  const base = `/posts/${encodeURIComponent(postId)}/media`;
  if (mediaIndex === undefined || mediaIndex === null || mediaIndex === 0) {
    return base;
  }
  return `${base}/${Number(mediaIndex)}`;
}

/** Profile slug, handle, or opaque user key — API resolves */
export function profilePath(userKey) {
  return `/profile/${encodeURIComponent(userKey)}`;
}

/** @param {string} conversationId conversation GUID or other-user userId until first message */
export function messagesPath(conversationId) {
  return `/messages/${encodeURIComponent(conversationId)}`;
}

export const messagesListPath = '/messages';

/** @param {string} partnerId */
export function partnerPath(partnerId) {
  return `/partners/${encodeURIComponent(partnerId)}`;
}

/** @param {string} partnerId - handle or organization id */
export function partnerManagePath(partnerId) {
  return `/partners/${encodeURIComponent(partnerId)}/manage`;
}

/** @param {string} partnerId */
export function partnerInvitePath(partnerId) {
  return `/partners/${encodeURIComponent(partnerId)}/invite`;
}

/** @param {string} partnerId @param {string} subId */
export function partnerSubnetworkPath(partnerId, subId) {
  return `/partners/${encodeURIComponent(partnerId)}/subnetworks/${encodeURIComponent(subId)}`;
}

export const feedPath = '/posts';

/**
 * Paths that do not require a session. Keep in sync with public Route entries in App.jsx.
 * Used when clearing an expired session so users stay on legal/auth pages instead of being forced to /login.
 */
const AUTH_OPTIONAL_EXACT = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/callback',
  '/verify-email',
  '/terms',
  '/privacy',
  '/cookie',
  '/accessibility',
  '/support',
  '/maintenance',
]);

/**
 * @param {string} pathname - `location.pathname` (no query string)
 * @returns {boolean} true if the user may stay on this path without a valid token/session
 */
export function isAuthOptionalPath(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return false;
  }
  const pathOnly = pathname.split('?')[0];
  return AUTH_OPTIONAL_EXACT.has(pathOnly);
}
