import {
  LayoutGrid,
  Building2,
  Calendar,
  Megaphone,
  UserCog,
  Settings,
  MessageSquareHeart,
  LifeBuoy,
  Flag,
  ClipboardList,
} from 'lucide-react';
import {
  PLATFORM_SUPPORT_CONTENT_MODERATION_PATH,
  PLATFORM_SUPPORT_INBOX_PATH,
} from '@/lib/platformSupportRoutes';

/** @typedef {{ icon: import('lucide-react').LucideIcon, labelPath: string, path: string, end?: boolean }} AdminNavItem */

/**
 * @param {{ contentReportsEnabled?: boolean }} options
 * @returns {AdminNavItem[]}
 */
export function getSupportNavItems({ contentReportsEnabled = false } = {}) {
  const items = [
    {
      icon: LifeBuoy,
      labelPath: 'nav.supportInbox',
      path: PLATFORM_SUPPORT_INBOX_PATH,
      end: true,
    },
  ];
  if (contentReportsEnabled) {
    items.push({
      icon: Flag,
      labelPath: 'nav.contentModeration',
      path: PLATFORM_SUPPORT_CONTENT_MODERATION_PATH,
      end: true,
    });
  }
  return items;
}

/**
 * @param {{ isPlatformAdmin: boolean, isPlatformSupport: boolean, isSupportOnly?: boolean, contentReportsEnabled?: boolean }} access
 * @returns {AdminNavItem[]}
 */
export function getAdminNavItems({ isPlatformAdmin, isPlatformSupport, isSupportOnly, contentReportsEnabled = false }) {
  const supportOnly = Boolean(
    isSupportOnly ?? (isPlatformSupport && !isPlatformAdmin),
  );

  if (supportOnly) {
    return getSupportNavItems({ contentReportsEnabled });
  }

  /** @type {AdminNavItem[]} */
  const items = [
    { icon: LayoutGrid, labelPath: 'nav.adminDashboard', path: '/admin', end: true },
  ];

  if (isPlatformAdmin) {
    items.push({
      icon: Building2,
      labelPath: 'nav.partnerManagement',
      path: '/admin/partners',
      end: false,
    });
  }

  items.push(
    { icon: Calendar, labelPath: 'nav.events', path: '/admin/events', end: false },
    { icon: Megaphone, labelPath: 'nav.ads', path: '/admin/ads', end: false },
    { icon: UserCog, labelPath: 'nav.usersAndRoles', path: '/admin/users', end: false },
  );

  if (isPlatformAdmin) {
    items.push({
      icon: MessageSquareHeart,
      labelPath: 'nav.feedbackSupport',
      path: '/admin/feedback',
      end: false,
    });
    if (contentReportsEnabled) {
      items.push({
        icon: Flag,
        labelPath: 'nav.contentModeration',
        path: '/admin/content-moderation',
        end: true,
      });
    }
    items.push({
      icon: Settings,
      labelPath: 'nav.adminSystemSettings',
      path: '/admin/settings',
      end: false,
    });
    items.push({
      icon: ClipboardList,
      labelPath: 'nav.auditLogs',
      path: '/admin/audit-logs',
      end: true,
    });
  }

  return items;
}

