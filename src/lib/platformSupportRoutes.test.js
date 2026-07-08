import { describe, it, expect } from 'vitest';
import {
  PLATFORM_SUPPORT_CONTENT_MODERATION_PATH,
  PLATFORM_SUPPORT_INBOX_PATH,
  isPlatformSupportContentModerationPath,
  isPlatformSupportInboxPath,
  isPlatformSupportStaffPath,
} from './platformSupportRoutes';

describe('platformSupportRoutes', () => {
  it('exports inbox path constant', () => {
    expect(PLATFORM_SUPPORT_INBOX_PATH).toBe('/support/inbox');
  });

  it('exports support content moderation path constant', () => {
    expect(PLATFORM_SUPPORT_CONTENT_MODERATION_PATH).toBe('/support/content-moderation');
  });

  it('detects support inbox paths', () => {
    expect(isPlatformSupportInboxPath('/support/inbox')).toBe(true);
    expect(isPlatformSupportInboxPath('/support/inbox/abc')).toBe(true);
    expect(isPlatformSupportInboxPath('/support')).toBe(false);
    expect(isPlatformSupportInboxPath('/admin/feedback')).toBe(false);
    expect(isPlatformSupportInboxPath('')).toBe(false);
  });

  it('detects support content moderation paths', () => {
    expect(isPlatformSupportContentModerationPath('/support/content-moderation')).toBe(true);
    expect(isPlatformSupportContentModerationPath('/support/content-moderation/cases')).toBe(true);
    expect(isPlatformSupportContentModerationPath('/admin/content-moderation')).toBe(false);
  });

  it('detects any support staff shell path', () => {
    expect(isPlatformSupportStaffPath('/support/inbox')).toBe(true);
    expect(isPlatformSupportStaffPath('/support/content-moderation')).toBe(true);
    expect(isPlatformSupportStaffPath('/admin/content-moderation')).toBe(false);
  });
});
