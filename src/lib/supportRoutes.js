import { getDisplayNameFromAccessToken, getEmailFromAccessToken } from '@/services/auth/authService';

/**
 * Prefill name/email on the public support form from the logged-in session.
 * @param {Record<string, unknown> | null | undefined} user
 * @param {string | null | undefined} [accessToken]
 * @returns {{ name: string, email: string }}
 */
export function resolveSupportSubmitterFromSession(user, accessToken = null) {
  if (!user) {
    return { name: '', email: '' };
  }
  const name = String(
    user.displayName ?? user.handle ?? (accessToken ? getDisplayNameFromAccessToken(accessToken) : '') ?? '',
  ).trim();
  const email = String(
    user.contactEmail ?? user.email ?? (accessToken ? getEmailFromAccessToken(accessToken) : '') ?? '',
  ).trim();
  return { name, email };
}

/**
 * @param {'support' | 'feedback'} kind
 * @returns {string}
 */
export function supportFormPath(kind) {  const type = kind === 'feedback' ? 'feedback' : 'support';
  return `/support?type=${type}`;
}

/**
 * @param {URLSearchParams | null | undefined} searchParams
 * @param {{ inquiryType?: string } | null | undefined} [locationState]
 * @returns {'Support' | 'Feedback' | ''}
 */
export function resolveSupportInquiryTypeFromRoute(searchParams, locationState) {
  const q = (searchParams?.get('type') ?? '').toLowerCase();
  if (q === 'feedback') {
    return 'Feedback';
  }
  if (q === 'support') {
    return 'Support';
  }
  const stateType = locationState?.inquiryType;
  if (stateType === 'Feedback' || stateType === 'Support') {
    return stateType;
  }
  return '';
}
