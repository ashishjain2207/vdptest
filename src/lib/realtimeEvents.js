/**
 * Single source of truth for browser CustomEvent names used across SignalR-driven UI.
 * Convention: vdpconnect:<domain>:<kebab-event>
 *
 * Domains: feed (posts), messages (DMs), notifications (bell / list).
 * Wire protocol (hub.on('ReceiveMessage', …)) stays PascalCase in @/services/*Hub.js;
 * only window events are standardized here.
 */

export const REALTIME = {
  feed: {
    POST_CREATED: 'vdpconnect:feed:post-created',
    POST_UPDATED: 'vdpconnect:feed:post-updated',
    POST_DELETED: 'vdpconnect:feed:post-deleted',
    POST_ENGAGEMENT_UPDATED: 'vdpconnect:feed:post-engagement-updated',
    BOOKMARKS_CHANGED: 'vdpconnect:feed:bookmarks-changed',
  },
  comments: {
    COMMENT_ENGAGEMENT_UPDATED: 'vdpconnect:comments:comment-engagement-updated',
  },
  messages: {
    CONNECTED: 'vdpconnect:messages:connected',
    DISCONNECTED: 'vdpconnect:messages:disconnected',
    RECONNECTING: 'vdpconnect:messages:reconnecting',
    RECONNECTED: 'vdpconnect:messages:reconnected',
    RECEIVE_MESSAGE: 'vdpconnect:messages:receive-message',
    USER_ONLINE: 'vdpconnect:messages:user-online',
    USER_OFFLINE: 'vdpconnect:messages:user-offline',
    ONLINE_USERS: 'vdpconnect:messages:online-users',
    USER_TYPING: 'vdpconnect:messages:user-typing',
    USER_STOPPED_TYPING: 'vdpconnect:messages:user-stopped-typing',
    READ_RECEIPT: 'vdpconnect:messages:read-receipt',
    MESSAGE_EDITED: 'vdpconnect:messages:message-edited',
    MESSAGE_DELETED: 'vdpconnect:messages:message-deleted',
    UNREAD_COUNT: 'vdpconnect:messages:unread-count',
  },
  notifications: {
    /** One notification payload from the hub (detail = mapped UI object). */
    ITEM_RECEIVED: 'vdpconnect:notifications:item-received',
    /** Counts or lists should resync (reconnect, mark-read, mark-all-read, etc.). */
    SYNC: 'vdpconnect:notifications:sync',
    /** Notifications hub finished reconnecting (re-join server groups). */
    HUB_RECONNECTED: 'vdpconnect:notifications:hub-reconnected',
  },
  supportInquiry: {
    /** New support/feedback ticket for staff inbox (detail: { platformSupportInquiryId? }). */
    INBOX_CHANGED: 'vdpconnect:support-inquiry:inbox-changed',
  },
  connections: {
    /** Peer relationship changed (detail: { peerUserId?, actorUserId?, isConnected?, hasPendingConnectionRequest?, hasConnectionRequestFromThem?, pendingConnectionRequestId?, notificationType? }). */
    RELATIONSHIP_CHANGED: 'vdpconnect:connections:relationship-changed',
  },
};

/**
 * @param {string} eventType
 * @param {unknown} [detail]
 */
export function dispatchRealtime(eventType, detail) {
  if (typeof window === 'undefined') {
    return;
  }
  const ev =
    detail === undefined
      ? new CustomEvent(eventType)
      : new CustomEvent(eventType, { detail });
  window.dispatchEvent(ev);
}
