/** @type {import('react-router-dom').NavigateFunction | null} */
let navigateRef = null;

export function registerAuthNavigate(navigate) {
  navigateRef = navigate;
}

export function unregisterAuthNavigate() {
  navigateRef = null;
}

/**
 * @param {import('react-router-dom').To} to
 * @param {{ replace?: boolean; state?: unknown }} [options]
 */
export function authNavigate(to, options) {
  if (navigateRef) {
    navigateRef(to, options);
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  const path = typeof to === 'string' ? to : String(to);
  if (options?.replace) {
    window.location.replace(path);
  } else {
    window.location.assign(path);
  }
}
