/** Staff support inbox inside the main app shell (regular sidebar + header). */
export const PLATFORM_SUPPORT_INBOX_PATH = '/support/inbox';

/** Staff content moderation queue in the main app shell (support staff; admins use `/admin/content-moderation`). */
export const PLATFORM_SUPPORT_CONTENT_MODERATION_PATH = '/support/content-moderation';

export function isPlatformSupportInboxPath(pathname) {
  const p = pathname?.split('?')[0] ?? '';
  return p === PLATFORM_SUPPORT_INBOX_PATH || p.startsWith(`${PLATFORM_SUPPORT_INBOX_PATH}/`);
}

export function isPlatformSupportContentModerationPath(pathname) {
  const p = pathname?.split('?')[0] ?? '';
  return p === PLATFORM_SUPPORT_CONTENT_MODERATION_PATH
    || p.startsWith(`${PLATFORM_SUPPORT_CONTENT_MODERATION_PATH}/`);
}

export function isPlatformSupportStaffPath(pathname) {
  return isPlatformSupportInboxPath(pathname) || isPlatformSupportContentModerationPath(pathname);
}
