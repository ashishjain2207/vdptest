import * as signalR from '@microsoft/signalr';
import { getAccessToken, getUserIdFromToken, ensureAccessToken } from './auth/authService.js';
import { API_BASE } from '@/lib/config';
import { mapApiNotificationToFrontend } from './notificationService.js';
import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';
import { dispatchFeedEvent, FEED_EVENTS } from '@/lib/feedEvents';
import { dispatchConnectionRelationshipChanged } from '@/lib/connectionEvents';

export const NOTIFICATIONS_HUB_RECONNECTED = REALTIME.notifications.HUB_RECONNECTED;

/** @type {import('@microsoft/signalr').HubConnection | null} */
let connection = null;

/** @type {Promise<import('@microsoft/signalr').HubConnection | null> | null} */
let startPromise = null;

function getHubUrl() {
  const base = (API_BASE || '').replace(/\/$/, '');
  return base ? `${base}/hubs/notifications` : '/hubs/notifications';
}

/**
 * Normalize user ids for comparison (JWT sub vs API user id). GUIDs may differ by dash casing;
 * empty payload userId means "trust the hub" (server already targeted the correct group).
 * @param {unknown} id
 * @returns {string}
 */
function normalizeUserIdForCompare(id) {
  if (id === null || id === undefined) {
    return '';
  }
  const s = String(id).trim().toLowerCase();
  if (!s) {
    return '';
  }
  const hexOnly = s.replace(/-/g, '');
  if (/^[0-9a-f]{32}$/i.test(hexOnly)) {
    return hexOnly;
  }
  return s;
}

function createConnection() {
  const url = getHubUrl();
  const hub = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      // Must return Promise<string>; negotiate POST sends Authorization: Bearer (see vite proxy forwardApiAuthorization).
      accessTokenFactory: async () => {
        const token = await ensureAccessToken();
        if (!token && import.meta.env.DEV) {
          console.warn(
            '[notifications hub] Missing access token. If REST /api calls work but hubs return 401, align API Jwt:Authority/Audience with your Identity server (e.g. audience vdpconnect-api).',
          );
        }
        return token ?? '';
      },
    })
    .withAutomaticReconnect([0, 500, 1000, 2000, 5000, 10000, 30000])
    .withServerTimeout(120000)
    .build();

  hub.on('SupportInquiryInboxChanged', (payload) => {
    const inquiryId = payload?.platformSupportInquiryId ?? payload?.PlatformSupportInquiryId ?? null;
    dispatchRealtime(REALTIME.supportInquiry.INBOX_CHANGED, {
      platformSupportInquiryId: inquiryId,
    });
  });
  hub.on('ReceiveNotification', (payload) => {
    if (payload) {
      const recipient = payload.userId ?? payload.UserId;
      const token = getAccessToken();
      const me = token ? getUserIdFromToken(token) : null;
      const rNorm = normalizeUserIdForCompare(recipient);
      const mNorm = normalizeUserIdForCompare(me);
      // Drop only when both ids are present and disagree. Empty recipient = trust SignalR group routing.
      if (rNorm && mNorm && rNorm !== mNorm) {
        return;
      }
      const mapped = mapApiNotificationToFrontend(payload);
      dispatchRealtime(REALTIME.notifications.ITEM_RECEIVED, mapped);
      if (mapped.type === 'connectionAccepted' || mapped.type === 'connectionRequest') {
        dispatchConnectionRelationshipChanged({
          actorUserId: mapped.actorId,
          notificationType: mapped.type,
          ...(mapped.type === 'connectionAccepted'
            ? { isConnected: true, hasPendingConnectionRequest: false, hasConnectionRequestFromThem: false, pendingConnectionRequestId: null }
            : { hasConnectionRequestFromThem: true }),
        });
      }
      if (mapped.type === 'platformSupportInquiry') {
        dispatchRealtime(REALTIME.supportInquiry.INBOX_CHANGED, {
          platformSupportInquiryId: mapped.platformSupportInquiryId ?? null,
        });
      }
      const postId = payload.postId ?? payload.PostId;
      if (postId) {
        dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
      }
    }
  });
  hub.on('PostEngagement', (payload) => {
    const postId = payload?.postId ?? payload?.PostId;
    if (!postId) {
      return;
    }
    const detail =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? { ...payload }
        : { postId };
    if ((detail.postId === undefined || detail.postId === null) && detail.PostId !== undefined && detail.PostId !== null) {
      detail.postId = detail.PostId;
    }
    dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, detail);
  });
  hub.on('CommentEngagement', (payload) => {
    const commentId = payload?.commentId ?? payload?.CommentId;
    if (!commentId) {
      return;
    }
    const detail =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? { ...payload }
        : { commentId };
    if (
      (detail.commentId === undefined || detail.commentId === null) &&
      detail.CommentId !== undefined &&
      detail.CommentId !== null
    ) {
      detail.commentId = detail.CommentId;
    }
    dispatchRealtime(REALTIME.comments.COMMENT_ENGAGEMENT_UPDATED, detail);
  });
  hub.on('FeedPostChanged', (payload) => {
    const postId = payload?.postId ?? payload?.PostId;
    const kind = String(payload?.changeType ?? payload?.ChangeType ?? '').toLowerCase();
    if (!postId) {
      return;
    }
    if (kind === 'created') {
      dispatchFeedEvent(FEED_EVENTS.POST_CREATED, { postId });
    } else if (kind === 'updated') {
      dispatchFeedEvent(FEED_EVENTS.POST_UPDATED, { postId });
    } else if (kind === 'deleted') {
      dispatchFeedEvent(FEED_EVENTS.POST_DELETED, { postId });
    }
  });
  hub.onreconnected(() => {
    // Delay so the unread-count API sees persisted rows; immediate SYNC often races and clears the badge.
    setTimeout(() => {
      dispatchRealtime(REALTIME.notifications.SYNC);
    }, 1500);
    dispatchRealtime(REALTIME.notifications.HUB_RECONNECTED);
  });

  return hub;
}

export async function connectNotificationsHub() {
  if (!(await ensureAccessToken())) {
    return null;
  }

  if (connection?.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  if (startPromise) {
    await startPromise;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      return connection;
    }
    if (
      connection?.state === signalR.HubConnectionState.Reconnecting ||
      connection?.state === signalR.HubConnectionState.Connecting
    ) {
      return connection;
    }
  }

  if (!(await ensureAccessToken())) {
    return null;
  }

  if (connection) {
    const st = connection.state;
    if (
      st === signalR.HubConnectionState.Connecting ||
      st === signalR.HubConnectionState.Reconnecting
    ) {
      return connection;
    }
    try {
      await connection.stop();
    } catch (_e) {
      // ignore
    }
    connection = null;
  }

  const hub = createConnection();
  connection = hub;

  startPromise = hub
    .start()
    .then(() => hub)
    .catch((err) => {
      console.warn('Notifications hub connection failed:', err);
      if (connection === hub) {
        connection = null;
      }
      return null;
    })
    .finally(() => {
      startPromise = null;
    });

  return startPromise;
}

export async function disconnectNotificationsHub() {
  if (startPromise) {
    try {
      await startPromise;
    } catch (_e) {
      // ignore
    }
    startPromise = null;
  }
  if (connection) {
    try {
      await connection.stop();
    } catch (_e) {
      // ignore
    }
    connection = null;
  }
}

export function getNotificationsHubConnection() {
  return connection;
}

export async function joinPostGroup(postId) {
  if (!postId || !connection || connection.state !== signalR.HubConnectionState.Connected) {
    return;
  }
  try {
    await connection.invoke('JoinPostGroup', String(postId));
  } catch (e) {
    console.warn('joinPostGroup failed:', e);
  }
}

export async function leavePostGroup(postId) {
  if (!postId || !connection || connection.state !== signalR.HubConnectionState.Connected) {
    return;
  }
  try {
    await connection.invoke('LeavePostGroup', String(postId));
  } catch (e) {
    console.warn('leavePostGroup failed:', e);
  }
}
