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
  LogOut,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@imriva/framework';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LangText } from '@/components/ui/LangText';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAccess } from '@/lib/platformAuth';
import { useT } from '@/i18n';
import { getInitials } from '@/lib/utils';
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

export function Sidebar() {
  const location = useLocation();
  const t = useT();
  const { user, logout, loading } = useAuth();
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const userAvatar = user?.avatarUrl;
  const userName = user?.displayName || user?.handle || 'User';
  const userHandle = user?.handle || '';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40 safe-top safe-left" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <NavLink
          to="/posts"
          className="flex items-center no-underline"
          aria-label="VDPConnect home"
        >
          <img src="/vdpConnect.png" alt="vdpConnect logo" width="200px" />
        </NavLink>
      </div>

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
                  aria-label={t(item.labelPath)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 no-underline min-w-0 min-h-[44px]',
                    'text-foreground hover:text-secondary hover:bg-muted active:bg-muted',
                    isActive && 'bg-muted text-primary font-medium',
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-primary' : 'text-foreground',
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

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        {loading ? (
          <div className="flex items-center gap-3 p-3 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : user ? (
          <div 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
            onClick={handleLogoutClick}
          >
            <Avatar className="w-10 h-10">
              {userAvatar ? (
                <AvatarImage src={userAvatar} alt={userName} />
              ) : null}
              <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              {userHandle && (
                <p className="text-xs text-muted-foreground truncate">@{userHandle}</p>
              )}
            </div>
            <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
          </div>
        ) : null}

        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <LangText path="layout.log_out"  />
              </AlertDialogTitle>
              <AlertDialogDescription>
                <LangText path="layout.are_you_sure_you_want_to_log_out_you_can_sign_in_again_anyti"  />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel><LangText path="common.cancel"  /></AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogoutConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <LangText path="admin.log_out"  />
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!user && !loading && (
          <div className="p-3 text-sm text-muted-foreground">
            {t('admin.not_logged_in')}
          </div>
        )}
      </div>
    </aside>
  );
}
