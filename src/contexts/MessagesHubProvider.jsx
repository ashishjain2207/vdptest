import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';
import {
  connectMessagesHub,
  disconnectMessagesHub,
  updateLastSeen,
} from '@/services/messagesHub';
import { getMessagesUnreadCount } from '@/services/messageService';
import { getAccessToken, getPlatformAuthFromToken } from '@/services';

async function refreshUnreadFromApi() {
  try {
    const unread = await getMessagesUnreadCount();
    const n = typeof unread === 'number' ? unread : 0;
    dispatchRealtime(REALTIME.messages.UNREAD_COUNT, { totalUnread: Math.max(0, Math.floor(n)) });
  } catch {
    /* ignore */
  }
}

export { MESSAGES_HUB_EVENTS, MESSAGES_UNREAD_COUNT_EVENT } from '@/contexts/messagesHubEvents';

const MAX_RETRIES = 8;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 6000, 10000, 15000, 20000, 30000];

function dispatchUnreadCountFromPayload(payload) {
  if (!payload || typeof payload !== 'object') { return; }
  const tu = payload.totalUnread ?? payload.TotalUnread;
  if (typeof tu !== 'number' || Number.isNaN(tu)) { return; }
  dispatchRealtime(REALTIME.messages.UNREAD_COUNT, { totalUnread: Math.max(0, Math.floor(tu)) });
}

/**
 * Connects to the Messages SignalR hub when the user is authenticated.
 * Stays connected for the whole session (all pages) until logout. Retries on failure.
 */
export function MessagesHubProvider({ children }) {
  const { user } = useAuth();
  const { maintenanceMode } = useMaintenanceMode();
  const connectedRef = useRef(false);
  const onUnreadCountRef = useRef((totalUnread) => {
    const n = Number(totalUnread);
    const value = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    dispatchRealtime(REALTIME.messages.UNREAD_COUNT, { totalUnread: value });
  });

  useEffect(() => {
    if (!user?.userId) {
      if (connectedRef.current) {
        void disconnectMessagesHub();
        connectedRef.current = false;
        dispatchRealtime(REALTIME.messages.DISCONNECTED);
      }
      return;
    }

    const token = getAccessToken();
    const isPlatformStaff = token ? getPlatformAuthFromToken(token).isPlatformStaff : false;
    if (maintenanceMode === true && !isPlatformStaff) {
      if (connectedRef.current) {
        void disconnectMessagesHub();
        connectedRef.current = false;
        dispatchRealtime(REALTIME.messages.DISCONNECTED);
      }
      return;
    }

    let mounted = true;
    let retryTimeoutId = null;

    const callbacks = {
      onReceiveMessage: (payload) => {
        if (mounted && payload) {
          dispatchRealtime(REALTIME.messages.RECEIVE_MESSAGE, payload);
          dispatchUnreadCountFromPayload(payload);
        }
      },
      onUserOnline: (userId) => {
        if (mounted && userId) {
          dispatchRealtime(REALTIME.messages.USER_ONLINE, userId);
        }
      },
      onUserOffline: (userId) => {
        if (mounted && userId) {
          dispatchRealtime(REALTIME.messages.USER_OFFLINE, userId);
        }
      },
      onOnlineUsers: (userIds) => {
        if (mounted && Array.isArray(userIds)) {
          dispatchRealtime(REALTIME.messages.ONLINE_USERS, userIds);
        }
      },
      onUserTyping: (conversationId, userId) => {
        if (mounted && conversationId && userId) {
          dispatchRealtime(REALTIME.messages.USER_TYPING, { conversationId, userId });
        }
      },
      onUserStoppedTyping: (conversationId, userId) => {
        if (mounted && conversationId && userId) {
          dispatchRealtime(REALTIME.messages.USER_STOPPED_TYPING, { conversationId, userId });
        }
      },
      onReadReceipt: (conversationId) => {
        if (mounted && conversationId) {
          dispatchRealtime(REALTIME.messages.READ_RECEIPT, conversationId);
        }
      },
      onMessageEdited: (payload) => {
        if (mounted && payload) {
          dispatchRealtime(REALTIME.messages.MESSAGE_EDITED, payload);
        }
      },
      onMessageDeleted: (payload) => {
        if (mounted && payload) {
          dispatchRealtime(REALTIME.messages.MESSAGE_DELETED, payload);
        }
      },
      onReconnecting: () => {
        if (mounted) {
          dispatchRealtime(REALTIME.messages.RECONNECTING);
        }
      },
      onReconnected: () => {
        if (mounted) {
          void updateLastSeen();
          dispatchRealtime(REALTIME.messages.RECONNECTED);
          void refreshUnreadFromApi();
        }
      },
    };

    function tryConnect(attempt = 0) {
      if (!mounted || !user?.userId) { return; }
      connectMessagesHub(callbacks)
        .then((hub) => {
          if (!mounted || !hub) { return; }
          connectedRef.current = true;
          dispatchRealtime(REALTIME.messages.CONNECTED);
          const handler = onUnreadCountRef.current;
          hub.off('UnreadCountUpdated');
          hub.on('UnreadCountUpdated', handler);
          void updateLastSeen();
        })
        .catch(() => {
          if (!mounted || !user?.userId) { return; }
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
            retryTimeoutId = setTimeout(() => tryConnect(attempt + 1), delay);
          }
        });
    }

    tryConnect();

    return () => {
      mounted = false;
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
      void disconnectMessagesHub();
      connectedRef.current = false;
      dispatchRealtime(REALTIME.messages.DISCONNECTED);
    };
  }, [user?.userId, maintenanceMode]);

  useEffect(() => {
    if (!user?.userId) {
      return undefined;
    }
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const t = getAccessToken();
      const staff = t ? getPlatformAuthFromToken(t).isPlatformStaff : false;
      if (maintenanceMode === true && !staff) {
        return;
      }
      void updateLastSeen();
      void refreshUnreadFromApi();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [user?.userId, maintenanceMode]);

  return children;
}
