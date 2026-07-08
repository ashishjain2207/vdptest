import { useEffect, useRef } from 'react';
import { REALTIME } from '@/lib/realtimeEvents';

const REFRESH_DEBOUNCE_MS = 400;

function isPlatformSupportInquiryNotification(detail) {
  return detail?.type === 'platformSupportInquiry';
}

/**
 * Refreshes the platform support inbox when a new ticket arrives via SignalR,
 * when a matching notification is received, or when the notifications hub reconnects.
 *
 * @param {() => void | Promise<void>} onRefresh
 */
export function useSupportInboxRealtimeRefresh(onRefresh) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const timerRef = useRef(null);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void onRefreshRef.current?.();
      }, REFRESH_DEBOUNCE_MS);
    };

    const onInboxChanged = () => {
      scheduleRefresh();
    };

    const onNotificationReceived = (event) => {
      if (isPlatformSupportInquiryNotification(event.detail)) {
        scheduleRefresh();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };

    window.addEventListener(REALTIME.supportInquiry.INBOX_CHANGED, onInboxChanged);
    window.addEventListener(REALTIME.notifications.ITEM_RECEIVED, onNotificationReceived);
    window.addEventListener(REALTIME.notifications.HUB_RECONNECTED, onInboxChanged);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener(REALTIME.supportInquiry.INBOX_CHANGED, onInboxChanged);
      window.removeEventListener(REALTIME.notifications.ITEM_RECEIVED, onNotificationReceived);
      window.removeEventListener(REALTIME.notifications.HUB_RECONNECTED, onInboxChanged);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
}
