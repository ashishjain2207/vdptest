import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@imriva/framework';
import { Heart, MessageCircle, UserPlus, AtSign, Repeat2, Check, Mail, ThumbsUp, Pin, Eye, Building2, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNotificationRoute } from '@/lib/notificationRoutes';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@imriva/framework';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  mapApiNotificationToFrontend,
  getNotificationDisplayTimestamp,
} from '@/services/notificationService';
import { dispatchPostEngagementForNotifications } from '@/lib/feedEvents';
import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { LangText } from '@/components/ui/LangText';
import { NotificationMessage } from '@/components/notifications/NotificationMessage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { usePlatformAccess } from '@/lib/platformAuth';
const getNotificationIcon = (type) => {
  switch (type) {
  case 'like':
    return <Heart className="w-4 h-4 text-destructive" />;
  case 'comment':
  case 'replyComment':
    return <MessageCircle className="w-4 h-4 text-primary" />;
  case 'commentLike':
    return <ThumbsUp className="w-4 h-4 text-primary" />;
  case 'pinComment':
    return <Pin className="w-4 h-4 text-amber-500" />;
  case 'follow':
  case 'connect':
  case 'connectionRequest':
  case 'connectionAccepted':
    return <UserPlus className="w-4 h-4 text-green-500" />;
  case 'mention':
    return <AtSign className="w-4 h-4 text-orange-500" />;
  case 'repost':
    return <Repeat2 className="w-4 h-4 text-blue-500" />;
  case 'messageMention':
    return <MessageCircle className="w-4 h-4 text-violet-500" />;
  case 'profileView':
    return <Eye className="w-4 h-4 text-cyan-500" />;
  case 'partnerInvite':
  case 'partnerJoinRequest':
  case 'partnerInviteAccepted':
  case 'partnerInviteDeclined':
  case 'partnerMembershipUpdate':
    return <Building2 className="w-4 h-4 text-sky-600" />;
  case 'platformSupportInquiry':
    return <LifeBuoy className="w-4 h-4 text-amber-600" />;
  default:
    return <Mail className="w-4 h-4 text-muted-foreground" />;
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const { isPlatformStaff } = usePlatformAccess();
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(() => {
    getNotifications(1, 20)
      .then((res) => {
        const items = (res.data ?? []).map(mapApiNotificationToFrontend);
        setNotifications(items);
        dispatchPostEngagementForNotifications(res.data ?? []);
      })
      .catch((err) => {
        setNotifications([]);
        toast.error(err.message || t('notifications.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNotifications(1, 20)
      .then((res) => {
        if (cancelled) {return;}
        const items = (res.data ?? []).map(mapApiNotificationToFrontend);
        setNotifications(items);
        if (!cancelled) {
          dispatchPostEngagementForNotifications(res.data ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setNotifications([]);
          toast.error(err.message || t('notifications.loadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) {setLoading(false);}
      });
    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    const onItemReceived = (e) => {
      const n = e.detail;
      if (!n) { return; }
      setNotifications((prev) => {
        if (!n?.id || prev.some((x) => String(x.id) === String(n.id))) {
          return prev;
        }
        return [n, ...prev];
      });
    };
    const onSync = () => {
      fetchNotifications();
    };
    window.addEventListener(REALTIME.notifications.ITEM_RECEIVED, onItemReceived);
    window.addEventListener(REALTIME.notifications.SYNC, onSync);
    return () => {
      window.removeEventListener(REALTIME.notifications.ITEM_RECEIVED, onItemReceived);
      window.removeEventListener(REALTIME.notifications.SYNC, onSync);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') {return true;}
    if (activeFilter === 'likes') {return n.type === 'like' || n.type === 'commentLike';}
    if (activeFilter === 'comments') {return n.type === 'comment';}
    if (activeFilter === 'follows') {return ['follow', 'connect', 'connectionRequest', 'connectionAccepted'].includes(n.type);}
    if (activeFilter === 'reposts') {return n.type === 'repost';}
    if (activeFilter === 'mentions') {return n.type === 'mention' || n.type === 'messageMention';}
    if (activeFilter === 'profileViews') {return n.type === 'profileView';}
    if (activeFilter === 'partners') {
      return (
        n.type === 'partnerInvite' ||
        n.type === 'partnerJoinRequest' ||
        n.type === 'partnerInviteAccepted' ||
        n.type === 'partnerInviteDeclined' ||
        n.type === 'partnerMembershipUpdate'
      );
    }
    if (activeFilter === 'supportInbox') {
      return n.type === 'platformSupportInquiry' && n.inquiryKind === 'support';
    }
    if (activeFilter === 'feedbackInbox') {
      return n.type === 'platformSupportInquiry' && n.inquiryKind === 'feedback';
    }
    return true;
  });

  const handleNotificationClick = (notification) => {
    const { path, state } = getNotificationRoute(notification);
    if (path !== '#') {
      navigate(path, state ? { state } : {});
    }
    if (!notification.isRead && notification.id) {
      markAsRead(notification.id)
        .then(() => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
          );
          dispatchRealtime(REALTIME.notifications.SYNC);
        })
        .catch(() => {});
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      dispatchRealtime(REALTIME.notifications.SYNC);
      toast.success(t('notifications.all_notifications_marked_as_read'));
    } catch (err) {
      toast.error(err.message || (t('notifications.failed_to_mark_all_as_read')));
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground"><LangText path="nav.notifications"  /></h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground mt-1">{unreadCount} <LangText path="notifications.unread_notifications"  /></p>
            )}
          </div>
          {unreadCount > 0 && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
                <Check className="w-4 h-4" />
                <LangText path="notifications.mark_all_read"  />
              </Button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v)}>
          <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border rounded-xl flex-wrap gap-1">
            <TabsTrigger value="all"><LangText path="common.all"  /></TabsTrigger>
            <TabsTrigger value="mentions"><LangText path="notifications.mentions"  /></TabsTrigger>
            <TabsTrigger value="likes"><LangText path="notifications.likes"  /></TabsTrigger>
            <TabsTrigger value="comments"><LangText path="notifications.comments"  /></TabsTrigger>
            <TabsTrigger value="follows"><LangText path="notifications.connections"  /></TabsTrigger>
            <TabsTrigger value="reposts"><LangText path="notifications.shared_posts"  /></TabsTrigger>
            <TabsTrigger value="profileViews"><LangText path="notifications.profile_views"  /></TabsTrigger>
            <TabsTrigger value="partners"><LangText path="nav.partners"  /></TabsTrigger>
            {isPlatformStaff ? (
              <>
                <TabsTrigger value="supportInbox">
                  <LangText path="notifications.support_inbox"  />
                </TabsTrigger>
                <TabsTrigger value="feedbackInbox">
                  <LangText path="notifications.feedback_inbox"  />
                </TabsTrigger>
              </>
            ) : null}
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground"><LangText path="notifications.loading_notifications"  /></div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'flex items-start gap-4 p-4 transition-colors hover:bg-accent/30 cursor-pointer',
                  !notification.isRead && 'bg-accent/20',
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    {notification.user?.avatar ? (
                      <AvatarImage src={notification.user.avatar} alt={notification.user?.name} />
                    ) : null}
                    <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                      {getInitials(notification.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card rounded-full flex items-center justify-center border-2 border-background">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <NotificationMessage notification={notification} />
                  <p className="text-sm text-muted-foreground mt-1">
                    {getNotificationDisplayTimestamp(notification, language)}
                  </p>
                </div>

                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <LangText path="notifications.no_notifications_in_this_category"  />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
