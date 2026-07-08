/** Routes that must never send query strings or hashes to telemetry. */
const SENSITIVE_PATHS = new Set(['/callback', '/reset-password', '/verify-email']);

/** Query parameter names whose values must not be sent to Application Insights. */
const SENSITIVE_QUERY_PARAMS = new Set([
  'code',
  'state',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'session_state',
  'userid',
  'userld',
  'password',
  'secret',
  'authorization',
  'client_secret',
  'api_key',
  'apikey',
]);

function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return '/';
  }
  return pathname.split('?')[0] || '/';
}

function isSensitiveQueryParam(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) {
    return false;
  }
  return SENSITIVE_QUERY_PARAMS.has(key) || SENSITIVE_QUERY_PARAMS.has(key.replace(/-/g, '_'));
}

/**
 * Redact token-bearing query strings before page views are sent to Application Insights.
 * Hash fragments are never included in telemetry output (accepted for API clarity, then ignored).
 * @param {{ origin?: string, pathname?: string, search?: string, hash?: string, title?: string }} input
 * @returns {{ name: string, uri: string }}
 */
export function buildSanitizedPageViewTelemetry({
  origin = '',
  pathname = '/',
  search = '',
  hash: _hash = '',
  title = '',
} = {}) {
  const pathOnly = normalizePathname(pathname);
  let safeSearch = '';

  if (!SENSITIVE_PATHS.has(pathOnly) && search) {
    const rawSearch = search.startsWith('?') ? search.slice(1) : search;
    const params = new URLSearchParams(rawSearch);
    const sanitized = new URLSearchParams();

    for (const [key, value] of params.entries()) {
      if (isSensitiveQueryParam(key)) {
        sanitized.append(key, '[Redacted]');
      } else {
        sanitized.append(key, value);
      }
    }

    const queryString = sanitized.toString();
    safeSearch = queryString ? `?${queryString}` : '';
  }

  const pathWithSearch = `${pathOnly}${safeSearch}`;
  const safeOrigin = typeof origin === 'string' ? origin : '';
  const uri = `${safeOrigin}${pathWithSearch}`;
  const trimmedTitle = typeof title === 'string' ? title.trim() : '';
  const name = trimmedTitle || pathWithSearch;

  return { name, uri };
}
