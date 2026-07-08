import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Repeat2, Check, ThumbsUp, Pin, Eye, Building2 } from 'lucide-react';
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  ScrollArea,
} from '@imriva/framework';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getNotificationRoute } from '@/lib/notificationRoutes';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  mapApiNotificationToFrontend,
  getNotificationDisplayTimestamp,
} from '@/services/notificationService';
import { useLanguage } from '@/contexts/LanguageContext';
import { dispatchPostEngagementForNotifications } from '@/lib/feedEvents';
import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';
import { useNotificationUnreadBadge } from '@/hooks/useNotificationUnreadBadge';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { NotificationMessage } from '@/components/notifications/NotificationMessage';
const getNotificationIcon = (type) => {
  switch (type) {
  case 'like':
    return <Heart className="w-3.5 h-3.5 text-destructive" />;
  case 'comment':
  case 'replyComment':
    return <MessageCircle className="w-3.5 h-3.5 text-primary" />;
  case 'commentLike':
    return <ThumbsUp className="w-3.5 h-3.5 text-primary" />;
  case 'pinComment':
    return <Pin className="w-3.5 h-3.5 text-amber-500" />;
  case 'follow':
  case 'connect':
  case 'connectionRequest':
  case 'connectionAccepted':
    return <UserPlus className="w-3.5 h-3.5 text-green-500" />;
  case 'mention':
    return <AtSign className="w-3.5 h-3.5 text-orange-500" />;
  case 'repost':
    return <Repeat2 className="w-3.5 h-3.5 text-blue-500" />;
  case 'messageMention':
    return <MessageCircle className="w-3.5 h-3.5 text-violet-500" />;
  case 'profileView':
    return <Eye className="w-3.5 h-3.5 text-cyan-500" />;
  case 'partnerInvite':
  case 'partnerJoinRequest':
  case 'partnerInviteAccepted':
  case 'partnerInviteDeclined':
  case 'partnerMembershipUpdate':
    return <Building2 className="w-3.5 h-3.5 text-sky-600" />;
  default:
    return null;
  }
};

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const [unreadCountFromApi, setUnreadCountFromApi] = useState(0);
  const openRef = useRef(open);
  openRef.current = open;

  const { applyTrustedUnreadCount } = useNotificationUnreadBadge(
    setUnreadCountFromApi,
    (n) => {
      setNotifications((prev) => {
        if (!n?.id || prev.some((x) => String(x.id) === String(n.id))) {
          return prev;
        }
        return [n, ...prev];
      });
      if (openRef.current) {
        getNotifications(1, 8)
          .then((res) => {
            const items = (res.data ?? []).map(mapApiNotificationToFrontend);
            setNotifications(items);
          })
          .catch(() => {});
      }
    },
  );

  useEffect(() => {
    if (open) {
      setLoading(true);
      getNotifications(1, 8)
        .then((res) => {
          const items = (res.data ?? []).map(mapApiNotificationToFrontend);
          setNotifications(items);
          dispatchPostEngagementForNotifications(res.data ?? []);
        })
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    }
  }, [open]);

  // When open, merge API + list counts so loading/slow networks (prod) don't drop to 0 before the
  // first page loads — otherwise the bell badge and "Mark all read" disappear briefly or stay hidden.
  const localUnread = notifications.filter(
    (n) => !n.isRead && !readIds.has(n.id),
  ).length;
  const unreadCount = open
    ? Math.max(localUnread, unreadCountFromApi)
    : unreadCountFromApi;

  const handleNotificationClick = (notification) => {
    const { path, state } = getNotificationRoute(notification);
    if (path !== '#') {
      setOpen(false);
      navigate(path, state ? { state } : {});
    }
    setReadIds((prev) => new Set([...prev, notification.id]));
    if (!notification.isRead && notification.id) {
      markAsRead(notification.id)
        .then(() => dispatchRealtime(REALTIME.notifications.SYNC))
        .catch(() => {});
    }
  };

  const refreshUnreadCount = () => {
    getUnreadCount().then(applyTrustedUnreadCount).catch(() => applyTrustedUnreadCount(0));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setReadIds(new Set(notifications.map((n) => n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshUnreadCount();
      dispatchRealtime(REALTIME.notifications.SYNC);
      toast.success(t('toasts.allNotificationsMarkedRead'));
    } catch (err) {
      toast.error(err.message || t('toasts.failedMarkAllRead'));
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" side="bottom">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground"><LangText path="nav.notifications"  /></h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={handleMarkAllRead}
            >
              <Check className="w-3 h-3" />
              <LangText path="notifications.mark_all_read" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[360px]">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <LangText path="layout.loading"  />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <LangText path="layout.no_notifications_yet"  />
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead =
                  notification.isRead || readIds.has(notification.id);
                return (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    className={cn(
                      'flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/50',
                      !isRead && 'bg-accent/30',
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-9 h-9">
                        {notification.user?.avatar ? (
                          <AvatarImage src={notification.user.avatar} alt={notification.user?.name} />
                        ) : null}
                        <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-xs font-medium">
                          {getInitials(notification.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-card rounded-full flex items-center justify-center border border-border">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <NotificationMessage notification={notification} compact />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getNotificationDisplayTimestamp(notification, language)}
                      </p>
                    </div>

                    {!isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-primary hover:text-primary"
            onClick={handleViewAll}
          >
            <LangText path="layout.view_all_notifications"  />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
