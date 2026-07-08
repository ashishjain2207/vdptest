import { REALTIME } from '@/lib/realtimeEvents';

/** Re-export for components that listen on window (same strings as REALTIME.messages). */
export const MESSAGES_HUB_EVENTS = REALTIME.messages;

export const MESSAGES_UNREAD_COUNT_EVENT = REALTIME.messages.UNREAD_COUNT;
