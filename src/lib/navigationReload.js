/**
 * True when this document was loaded via a full browser reload (e.g. F5).
 * In an SPA, client-side route changes reuse the same navigation entry as the first load,
 * so this stays false when moving between in-app routes without refreshing.
 */
export function isNavigationReload() {
  if (typeof performance === 'undefined') {
    return false;
  }
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    return nav?.type === 'reload';
  } catch {
    return false;
  }
}
