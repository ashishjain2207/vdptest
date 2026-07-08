/** @type {string} */
const STORAGE_KEY = 'vdp_ad_analytics_session_id';

/**
 * Stable id for the browser tab session (distinct user_session_id for impression dedupe).
 * @returns {string}
 */
export function getAdAnalyticsSessionId() {
  try {
    if (typeof sessionStorage === 'undefined') {
      return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    }
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }
}
