import { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  Users,
  Building2,
  LayoutDashboard,
  Calendar,
  MessageCircle,
  Bell,
  Bookmark,
  Settings,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAccess } from '@/lib/platformAuth';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@imriva/framework';
import { useT } from '@/i18n';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { getMessagesUnreadCount } from '@/services/messageService';
import { MESSAGES_HUB_EVENTS, MESSAGES_UNREAD_COUNT_EVENT } from '@/contexts/messagesHubEvents';
import { useNotificationUnreadBadge } from '@/hooks/useNotificationUnreadBadge';

import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';

const allNavItems = [
  { icon: Home, labelPath: 'nav.home', path: '/posts' },
  { icon: Compass, labelPath: 'nav.explore', path: '/explore' },
  { icon: Users, labelPath: 'nav.people', path: '/people' },
  { icon: Building2, labelPath: 'nav.partners', path: '/partners' },
  {
    icon: LayoutDashboard,
    labelPath: 'nav.adminPanel',
    labelSupportPath: 'nav.supportInbox',
    path: '/admin',
    pathSupport: PLATFORM_SUPPORT_INBOX_PATH,
    requiresPlatformStaff: true,
    activePathPrefix: '/admin',
    activePathSupport: PLATFORM_SUPPORT_INBOX_PATH,
  },
  { icon: Calendar, labelPath: 'nav.events', path: '/events' },
  { icon: MessageCircle, labelPath: 'nav.conversations', path: '/messages' },
  { icon: Bell, labelPath: 'nav.notifications', path: '/notifications' },
  { icon: Bookmark, labelPath: 'nav.savedPosts', path: '/bookmarks' },
  { icon: Settings, labelPath: 'nav.settings', path: '/settings' },
];

export function MobileSidebar({ open, onClose }) {
  const location = useLocation();
  const t = useT();
  const { user } = useAuth();
  const { isSupportOnly, isPlatformStaff } = usePlatformAccess();
  const navItems = allNavItems
    .filter((item) => {
      if (item.requiresPlatformStaff && !isPlatformStaff) {
        return false;
      }
      return true;
    })
    .map((item) => {
      if (item.pathSupport && isSupportOnly) {
        return {
          ...item,
          path: item.pathSupport,
          activePathPrefix: item.activePathSupport ?? item.pathSupport,
          labelPath: item.labelSupportPath ?? item.labelPath,
        };
      }
      return item;
    });
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const displayName = user?.displayName ?? user?.handle ?? 'User';
  const handle = user?.handle ?? '';
  const avatarUrl = user?.avatarUrl;
  const followersCount = user?.followers ?? user?.followersCount ?? 0;
  const followingCount = user?.following ?? user?.followingCount ?? 0;

  useNotificationUnreadBadge(setNotificationUnreadCount);

  useEffect(() => {
    const syncFromApi = () => {
      getMessagesUnreadCount().then(setMessagesUnreadCount).catch(() => setMessagesUnreadCount(0));
    };
    syncFromApi();
    const onUnread = (e) => {
      const n = e.detail?.totalUnread;
      if (typeof n === 'number' && !Number.isNaN(n)) {
        setMessagesUnreadCount(Math.max(0, Math.floor(n)));
      }
    };
    window.addEventListener(MESSAGES_UNREAD_COUNT_EVENT, onUnread);
    const onReconnect = () => syncFromApi();
    window.addEventListener(MESSAGES_HUB_EVENTS.RECONNECTED, onReconnect);
    return () => {
      window.removeEventListener(MESSAGES_UNREAD_COUNT_EVENT, onUnread);
      window.removeEventListener(MESSAGES_HUB_EVENTS.RECONNECTED, onReconnect);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[10000] transition-opacity lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed left-0 top-0 h-screen w-72 bg-card border-r border-border flex flex-col z-[10000] transition-transform lg:hidden safe-top safe-left',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-9" aria-label="VDPConnect home" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                {handle && <p className="text-xs text-muted-foreground truncate">@{handle}</p>}
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-sm">
              <span>
                <strong className="text-foreground">{followingCount}</strong>{' '}
                <span className="text-muted-foreground"><LangText path="layout.following"  /></span>
              </span>
              <span>
                <strong className="text-foreground">{followersCount.toLocaleString()}</strong>{' '}
                <span className="text-muted-foreground"><LangText path="people.followers"  /></span>
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.activePathPrefix
                ? location.pathname.startsWith(item.activePathPrefix)
                : location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    aria-label={t(item.labelPath)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-w-0 min-h-[44px]',
                      'hover:bg-accent hover:text-accent-foreground active:bg-accent',
                      isActive && 'bg-accent text-accent-foreground font-medium',
                    )}
                  >
                    <item.icon className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive && 'text-primary',
                    )} />
                    <span className="flex-1 min-w-0 truncate">
                      <LangText path={item.labelPath} />
                    </span>
                    {item.path === '/notifications' && notificationUnreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
                        {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                      </span>
                    )}
                    {item.path === '/messages' && messagesUnreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
                        {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
