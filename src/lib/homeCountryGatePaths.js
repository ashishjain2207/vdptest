/** Routes reachable without home country (auth, onboarding, staff tools, account settings, legal). */
export const HOME_COUNTRY_EXEMPT_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/callback',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/maintenance',
  '/terms',
  '/privacy',
  '/cookie',
  '/accessibility',
  '/support',
  '/admin',
  '/settings',
  '/onboarding',
  '/access-denied',
];

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isHomeCountryExemptPath(pathname) {
  const p = pathname?.split('?')[0] ?? '';
  return HOME_COUNTRY_EXEMPT_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

/**
 * All authenticated app routes except exempt paths require a home country.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
export function isHomeCountryRequiredPath(pathname) {
  const p = pathname?.split('?')[0] ?? '';
  return !isHomeCountryExemptPath(p);
}
