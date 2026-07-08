import { describe, it, expect } from 'vitest';
import { getAdminNavItems, getSupportNavItems } from './adminNavItems';
import {
  PLATFORM_SUPPORT_CONTENT_MODERATION_PATH,
  PLATFORM_SUPPORT_INBOX_PATH,
} from '@/lib/platformSupportRoutes';

describe('getAdminNavItems', () => {
  it('returns only support inbox for support-only users', () => {
    const nav = getAdminNavItems({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isSupportOnly: true,
    });
    expect(nav).toHaveLength(1);
    expect(nav[0].path).toBe(PLATFORM_SUPPORT_INBOX_PATH);
    expect(nav[0].labelPath).toBe('nav.supportInbox');
  });

  it('includes content moderation for support-only when reports are enabled', () => {
    const nav = getAdminNavItems({
      isPlatformAdmin: false,
      isPlatformSupport: true,
      isSupportOnly: true,
      contentReportsEnabled: true,
    });
    expect(nav).toHaveLength(2);
    expect(nav.map((n) => n.path)).toEqual([
      PLATFORM_SUPPORT_INBOX_PATH,
      PLATFORM_SUPPORT_CONTENT_MODERATION_PATH,
    ]);
  });

  it('getSupportNavItems links content moderation under /support when reports are enabled', () => {
    const nav = getSupportNavItems({ contentReportsEnabled: true });
    expect(nav.map((n) => n.path)).toEqual([
      PLATFORM_SUPPORT_INBOX_PATH,
      PLATFORM_SUPPORT_CONTENT_MODERATION_PATH,
    ]);
    expect(nav.map((n) => n.path)).not.toContain('/admin/content-moderation');
  });

  it('returns full admin nav for platform admin when content reports are enabled', () => {
    const nav = getAdminNavItems({
      isPlatformAdmin: true,
      isPlatformSupport: false,
      contentReportsEnabled: true,
    });
    const paths = nav.map((n) => n.path);
    expect(paths).toContain('/admin');
    expect(paths).toContain('/admin/partners');
    expect(paths).toContain('/admin/feedback');
    expect(paths).toContain('/admin/content-moderation');
    expect(paths).toContain('/admin/settings');
    expect(paths).not.toContain(PLATFORM_SUPPORT_INBOX_PATH);
  });

  it('hides content moderation when content reports are disabled', () => {
    const nav = getAdminNavItems({
      isPlatformAdmin: true,
      isPlatformSupport: false,
      contentReportsEnabled: false,
    });
    const paths = nav.map((n) => n.path);
    expect(paths).not.toContain('/admin/content-moderation');
    expect(paths).toContain('/admin/settings');
  });

  it('omits partner management and feedback for non-admin staff without support-only flag', () => {
    const nav = getAdminNavItems({
      isPlatformAdmin: false,
      isPlatformSupport: false,
    });
    const paths = nav.map((n) => n.path);
    expect(paths).toContain('/admin/events');
    expect(paths).not.toContain('/admin/partners');
    expect(paths).not.toContain('/admin/feedback');
  });
});
