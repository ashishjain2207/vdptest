/** Default API origin for production builds when no env var is set (must match deploy defaults). */
const PRODUCTION_API_DEFAULT = 'https://dev.api.vdpconnect.idxd.de';

function normalizeApiBase(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  return url.replace(/\/$/, '');
}

/**
 * Base URL for the VdpConnect API (no trailing slash).
 * - **Development (`vite`):** always `''` so all requests use relative paths (`/api/...`, `/hubs/...`) and the Vite proxy.
 * - **Production:** `VITE_API_BASE_URL`, then `VITE_API_URL`, then {@link PRODUCTION_API_DEFAULT}.
 *
 * Do not set `VITE_API_BASE_URL` to a full URL in dev expecting the app to call it directly; use `vite.config.js`
 * proxy `target` for the backend host instead.
 */
export const API_BASE = import.meta.env.DEV
  ? ''
  : normalizeApiBase(
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || PRODUCTION_API_DEFAULT,
  );

/** Fallback when profile avatar URL is null (from public folder). */
export const DEFAULT_AVATAR = '/default-profile.png';
