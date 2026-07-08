import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import {
  connectNotificationsHub,
  disconnectNotificationsHub,
} from '@/services/notificationsHub';
import { getAccessToken, getPlatformAuthFromToken } from '@/services';

const MAX_RETRIES = 8;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 6000, 10000, 15000, 20000, 30000];

/**
 * Connects to the Notifications SignalR hub when the user is authenticated.
 * Incoming pushes are surfaced as REALTIME.notifications.ITEM_RECEIVED / SYNC (see @/lib/realtimeEvents).
 * Retries on initial failure (same idea as MessagesHubProvider). Resyncs counts when the tab becomes visible.
 */
export function NotificationsHubProvider({ children }) {
  const { user } = useAuth();
  const { maintenanceMode } = useMaintenanceMode();

  useEffect(() => {
    if (!user?.userId) {
      void disconnectNotificationsHub();
      return undefined;
    }

    const token = getAccessToken();
    const isPlatformStaff = token ? getPlatformAuthFromToken(token).isPlatformStaff : false;
    if (maintenanceMode === true && !isPlatformStaff) {
      void disconnectNotificationsHub();
      return undefined;
    }

    let mounted = true;
    let retryTimeoutId = null;

    function tryConnect(attempt = 0) {
      connectNotificationsHub()
        .then((hub) => {
          if (!mounted) {
            return;
          }
          if (!hub && attempt < MAX_RETRIES) {
            const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
            retryTimeoutId = setTimeout(() => tryConnect(attempt + 1), delay);
          }
        })
        .catch(() => {
          if (!mounted || attempt >= MAX_RETRIES) {
            return;
          }
          const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
          retryTimeoutId = setTimeout(() => tryConnect(attempt + 1), delay);
        });
    }

    tryConnect();

    return () => {
      mounted = false;
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      void disconnectNotificationsHub();
    };
  }, [user?.userId, maintenanceMode]);

  const visibleSyncRef = useRef(false);
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
      // Debounce rapid visibility flicker (e.g. OS alt-tab)
      if (visibleSyncRef.current) {
        return;
      }
      visibleSyncRef.current = true;
      setTimeout(() => {
        visibleSyncRef.current = false;
      }, 2000);
      // Reconnect only — do not SYNC here; it refetches unread count and can race with optimistic ITEM_RECEIVED.
      void connectNotificationsHub();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [user?.userId, maintenanceMode]);

  return children;
}
