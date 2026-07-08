import { useCallback, useEffect, useRef } from 'react';
import { getUnreadCount } from '@/services/notificationService';
import { REALTIME } from '@/lib/realtimeEvents';

const SYNC_DEBOUNCE_MS = 400;

/**
 * Keeps notification unread count in sync with REST + SignalR without letting a stale
 * unread-count response (right after ITEM_RECEIVED) wipe the badge.
 *
 * @param {React.Dispatch<React.SetStateAction<number>>} setUnreadCount
 * @param {(detail: unknown) => void} [onItemDetail] - e.g. prepend to dropdown list (optional).
 * @returns {{ applyTrustedUnreadCount: (n: number) => void }}
 */
export function useNotificationUnreadBadge(setUnreadCount, onItemDetail) {
  const pendingHubPushesRef = useRef(0);
  const syncTimerRef = useRef(null);
  const onItemDetailRef = useRef(onItemDetail);
  onItemDetailRef.current = onItemDetail;

  const applyTrustedUnreadCount = useCallback((api) => {
    pendingHubPushesRef.current = 0;
    if (typeof api !== 'number' || Number.isNaN(api)) {
      setUnreadCount(0);
      return;
    }
    setUnreadCount(Math.max(0, api));
  }, [setUnreadCount]);

  useEffect(() => {
    const applyApiCount = (api) => {
      setUnreadCount((prev) => {
        if (typeof api !== 'number' || Number.isNaN(api)) {
          return prev;
        }
        const p = pendingHubPushesRef.current;
        if (p > 0 && api < prev) {
          return prev;
        }
        pendingHubPushesRef.current = 0;
        return Math.max(0, api);
      });
    };

    const runDebouncedSync = () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = setTimeout(() => {
        syncTimerRef.current = null;
        getUnreadCount().then(applyApiCount).catch(() => setUnreadCount(0));
      }, SYNC_DEBOUNCE_MS);
    };

    const onItemReceived = (e) => {
      const detail = e.detail;
      if (!detail) {
        return;
      }
      pendingHubPushesRef.current += 1;
      setUnreadCount((prev) => prev + 1);
      onItemDetailRef.current?.(detail);
    };

    const onSync = () => {
      runDebouncedSync();
    };

    getUnreadCount().then(applyApiCount).catch(() => setUnreadCount(0));

    window.addEventListener(REALTIME.notifications.ITEM_RECEIVED, onItemReceived);
    window.addEventListener(REALTIME.notifications.SYNC, onSync);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      window.removeEventListener(REALTIME.notifications.ITEM_RECEIVED, onItemReceived);
      window.removeEventListener(REALTIME.notifications.SYNC, onSync);
    };
  }, [setUnreadCount]);

  return { applyTrustedUnreadCount };
}
