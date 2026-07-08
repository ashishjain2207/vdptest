/**
 * API path prefixes whose responses are scoped by active market (X-Country-Code / resolver).
 * Used for platform-admin regional preview: only these calls use the admin header selection.
 * Paths are compared case-insensitively (ASP.NET routing is case-insensitive).
 *
 * Global (not listed here): users, profiles, follows, connections, messages, notifications —
 * no market header required for cross-border social graph.
 */
const REGIONAL_MARKET_API_PREFIXES = [
  '/api/posts',
  '/api/comments',
  '/api/advertisements',
  '/api/events',
  '/api/partners',
  '/api/trendings',
];

/**
 * @param {string} pathname - URL pathname (e.g. from `new URL(url).pathname`)
 * @returns {boolean}
 */
export function isRegionalMarketScopedApiPath(pathname) {
  const p = (pathname || '').toLowerCase();
  for (const prefix of REGIONAL_MARKET_API_PREFIXES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}
