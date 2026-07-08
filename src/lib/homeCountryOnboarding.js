import { getHomeCountryCode } from '@/lib/activeCountry';

export const ONBOARDING_PATH = '/onboarding';

/**
 * @param {{ homeCountryCode?: string | null } | null | undefined} profile
 * @returns {boolean}
 */
export function profileHasHomeCountry(profile) {
  return Boolean(String(profile?.homeCountryCode ?? '').trim());
}

/**
 * @param {{ homeCountryCode?: string | null } | null | undefined} user
 * @returns {boolean}
 */
export function userHasHomeCountry(user) {
  return profileHasHomeCountry(user) || Boolean(String(getHomeCountryCode() ?? '').trim());
}

/**
 * @param {string} [returnPath]
 * @returns {string}
 */
export function buildOnboardingRedirectUrl(returnPath = '/') {
  const trimmed = String(returnPath ?? '').trim();
  const safeReturn =
    trimmed
    && trimmed !== '/login'
    && trimmed !== ONBOARDING_PATH
    && !trimmed.startsWith(`${ONBOARDING_PATH}?`)
      ? trimmed
      : '/posts';
  if (safeReturn === '/' || safeReturn === '/posts') {
    return ONBOARDING_PATH;
  }
  return `${ONBOARDING_PATH}?returnUrl=${encodeURIComponent(safeReturn)}`;
}

/**
 * @param {string} [searchReturnUrl]
 * @returns {string}
 */
export function resolveOnboardingReturnPath(searchReturnUrl) {
  const trimmed = String(searchReturnUrl ?? '').trim();
  if (
    trimmed
    && trimmed.startsWith('/')
    && !trimmed.startsWith('//')
    && trimmed !== ONBOARDING_PATH
    && !trimmed.startsWith(`${ONBOARDING_PATH}?`)
  ) {
    return trimmed;
  }
  return '/posts';
}
