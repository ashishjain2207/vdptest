import { apiGet, apiPatch } from './api/client.js';
import { API_BASE } from '@/lib/config';
import { parseUtcIso } from '@/lib/utils';
import { t, tParams } from '@/i18n';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Maps API notification type (number) to string for routing/icons.
 * NotificationType enum: Like=0, Follow=1, Comment=2, Mention=3, Repost=4, Event=5, Connect=6,
 * ConnectionRequest=7, ConnectionAccepted=8, ProfileView=9, CommentLike=10, PinComment=11, ReplyComment=12, MessageMention=13, PartnerInvite=14, PartnerJoinRequest=15, PartnerInviteAccepted=16, PartnerInviteDeclined=17, PartnerMembershipUpdate=18, PlatformSupportInquiry=19
 */
const notificationTypeByNumber = {
  0: 'like',
  1: 'follow',
  2: 'comment',
  3: 'mention',
  4: 'repost',
  5: 'event',
  6: 'connect',
  7: 'connectionRequest',
  8: 'connectionAccepted',
  9: 'profileView',
  10: 'commentLike',
  11: 'pinComment',
  12: 'replyComment',
  13: 'messageMention',
  14: 'partnerInvite',
  15: 'partnerJoinRequest',
  16: 'partnerInviteAccepted',
  17: 'partnerInviteDeclined',
  18: 'partnerMembershipUpdate',
  19: 'platformSupportInquiry',
};

/** .NET enum name → frontend type (REST / SignalR may send string enums in some hosts). */
const notificationTypeByEnumName = {
  Like: 'like',
  Follow: 'follow',
  Comment: 'comment',
  Mention: 'mention',
  Repost: 'repost',
  Event: 'event',
  Connect: 'connect',
  ConnectionRequest: 'connectionRequest',
  ConnectionAccepted: 'connectionAccepted',
  ProfileView: 'profileView',
  CommentLike: 'commentLike',
  PinComment: 'pinComment',
  ReplyComment: 'replyComment',
  MessageMention: 'messageMention',
  PartnerInvite: 'partnerInvite',
  PartnerJoinRequest: 'partnerJoinRequest',
  PartnerInviteAccepted: 'partnerInviteAccepted',
  PartnerInviteDeclined: 'partnerInviteDeclined',
  PartnerMembershipUpdate: 'partnerMembershipUpdate',
  PlatformSupportInquiry: 'platformSupportInquiry',
  // Some serializers / proxies send camelCase enum strings
  partnerInvite: 'partnerInvite',
  partnerJoinRequest: 'partnerJoinRequest',
  partnerInviteAccepted: 'partnerInviteAccepted',
  partnerInviteDeclined: 'partnerInviteDeclined',
  partnerMembershipUpdate: 'partnerMembershipUpdate',
  platformSupportInquiry: 'platformSupportInquiry',
};

/**
 * Coerces API/SignalR `type` (number, numeric string, or enum name) to a stable string.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeNotificationType(raw) {
  if (raw === null || raw === undefined) {
    return 'unknown';
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return notificationTypeByNumber[raw] ?? 'unknown';
  }
  const s = String(raw).trim();
  if (s === '') {
    return 'unknown';
  }
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return notificationTypeByNumber[n] ?? 'unknown';
  }
  if (notificationTypeByEnumName[s]) {
    return notificationTypeByEnumName[s];
  }
  const lower = s.charAt(0).toLowerCase() + s.slice(1);
  if (notificationTypeByEnumName[lower]) {
    return notificationTypeByEnumName[lower];
  }
  return 'unknown';
}

export function getNotificationTypeName(type) {
  return normalizeNotificationType(type);
}

/** @param {unknown} v */
export function normalizeGuidish(v) {
  if (v === null || v === undefined) {
    return undefined;
  }
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

/**
 * True when the invitee can accept/decline a partner invite from this row.
 * Accept/decline only needs `partnerInviteId`; org id is for navigation.
 * @param {{ type?: string, partnerInviteId?: string }} n
 */
export function canActOnPartnerInviteNotification(n) {
  return n?.type === 'partnerInvite' && Boolean(normalizeGuidish(n?.partnerInviteId));
}

/**
 * True when staff can accept/decline a join request from this row.
 * @param {{ type?: string, partnerJoinRequestId?: string, organizationId?: string }} n
 */
export function canActOnPartnerJoinRequestNotification(n) {
  return (
    n?.type === 'partnerJoinRequest' &&
    Boolean(normalizeGuidish(n?.partnerJoinRequestId)) &&
    Boolean(normalizeGuidish(n?.organizationId))
  );
}

/**
 * Fetches paginated notifications for the current user.
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @returns {Promise<{ data: Array, page: number, pageSize: number, totalCount: number, totalPages: number }>}
 */
export async function getNotifications(page = 1, pageSize = 20) {
  const res = await apiGet(
    `${base}/api/Notifications?page=${page}&pageSize=${pageSize}`,
    { showLoader: false },
  );
  if (!res.ok) {
    if (res.status === 401) {return { data: [], page: 1, pageSize, totalCount: 0, totalPages: 0 };}
    throw new Error(`Failed to fetch notifications: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches unread notification count.
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const res = await apiGet(`${base}/api/Notifications/unread-count`, { showLoader: false });
  if (!res.ok) {return 0;}
  return res.json();
}

/**
 * Marks a notification as read.
 * @param {string} notificationId
 * @returns {Promise<boolean>}
 */
export async function markAsRead(notificationId) {
  const res = await apiPatch(
    `${base}/api/Notifications/${notificationId}/read`,
    null,
    { showLoader: false },
  );
  return res.ok || res.status === 204;
}

/**
 * Marks all notifications as read.
 * @returns {Promise<boolean>}
 */
export async function markAllAsRead() {
  const res = await apiPatch(`${base}/api/Notifications/read-all`, null, { showLoader: false });
  return res.ok || res.status === 204;
}

/**
 * Parses "{Inviter} invited you to join {Org}." (API partner-invite body).
 * @param {string} [content]
 * @returns {{ inviter: string, organization: string } | null}
 */
export function parsePartnerInviteContent(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }
  const m = content.trim().match(/^(.+?) invited you to join (.+?)\.?$/);
  if (!m) {
    return null;
  }
  return { inviter: m[1].trim(), organization: m[2].trim() };
}

/**
 * Parses "{Requester} requested to join {Org}." (API partner join-request body).
 * @param {string} [content]
 * @returns {{ requester: string, organization: string } | null}
 */
export function parsePartnerJoinRequestContent(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }
  const m = content.trim().match(/^(.+?) requested to join (.+?)\.?$/);
  if (!m) {
    return null;
  }
  return { requester: m[1].trim(), organization: m[2].trim() };
}

/**
 * Parses "{Invitee} accepted your invitation to join {Org}." (inviter-facing).
 * @param {string} [content]
 * @returns {{ invitee: string, organization: string } | null}
 */
export function parsePartnerInviteAcceptedContent(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }
  const m = content.trim().match(/^(.+?) accepted your invitation to join (.+?)\.?$/);
  if (!m) {
    return null;
  }
  return { invitee: m[1].trim(), organization: m[2].trim() };
}

/**
 * Parses "{Invitee} declined your invitation to join {Org}." (inviter-facing).
 * @param {string} [content]
 * @returns {{ invitee: string, organization: string } | null}
 */
export function parsePartnerInviteDeclinedContent(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }
  const m = content.trim().match(/^(.+?) declined your invitation to join (.+?)\.?$/);
  if (!m) {
    return null;
  }
  return { invitee: m[1].trim(), organization: m[2].trim() };
}

/**
 * Derives support vs feedback for platform inbox notifications from API content.
 * @param {string | undefined} content
 * @returns {'support' | 'feedback' | null}
 */
export function parsePlatformSupportInquiryKind(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }
  const text = content.trim();
  if (/^New feedback request from /i.test(text)) {
    return 'feedback';
  }
  if (/^New support request from /i.test(text)) {
    return 'support';
  }
  return null;
}

/**
 * Maps API notification to frontend format (for Notifications page / dropdown).
 * API returns: { id, userId, type, actorId, actorProfileSlug, postId, commentId, content, isRead, createdAt }
 * Frontend expects: { id, type, content, isRead, timestamp, user: { id, name, handle, profileSlug, avatar }, actorProfileSlug }
 * Prefer actorProfileSlug for profile routes to avoid "Invalid user" when profile exists.
 */
export function mapApiNotificationToFrontend(n) {
  const rawType = n.type ?? n.Type;
  const typeName = normalizeNotificationType(rawType);
  const partnerInviteId = normalizeGuidish(
    n.partnerInviteId ?? n.PartnerInviteId ?? n.inviteId ?? n.InviteId,
  );
  const organizationId = normalizeGuidish(n.organizationId ?? n.OrganizationId);
  const partnerJoinRequestId = normalizeGuidish(
    n.partnerJoinRequestId ?? n.PartnerJoinRequestId,
  );
  const platformSupportInquiryId = normalizeGuidish(
    n.platformSupportInquiryId ?? n.PlatformSupportInquiryId,
  );
  const rawContent = n.content ?? n.Content ?? '';
  let actorDisplayName = 'Someone';
  if (typeof rawContent === 'string' && rawContent.length > 0) {
    const firstWord = rawContent.split(/\s+/)[0];
    if (firstWord) {
      actorDisplayName = firstWord;
    }
  }
  if (typeName === 'partnerInvite') {
    const p = parsePartnerInviteContent(rawContent);
    if (p) {
      actorDisplayName = p.inviter;
    }
  } else if (typeName === 'partnerJoinRequest') {
    const p = parsePartnerJoinRequestContent(rawContent);
    if (p) {
      actorDisplayName = p.requester;
    }
  } else if (typeName === 'partnerInviteAccepted') {
    const p = parsePartnerInviteAcceptedContent(rawContent);
    if (p) {
      actorDisplayName = p.invitee;
    }
  } else if (typeName === 'partnerInviteDeclined') {
    const p = parsePartnerInviteDeclinedContent(rawContent);
    if (p) {
      actorDisplayName = p.invitee;
    }
  } else if (typeName === 'platformSupportInquiry' && typeof rawContent === 'string') {
    const fromMatch = rawContent.match(/^New (?:support|feedback) request from (.+?)\.?$/i);
    if (fromMatch) {
      actorDisplayName = fromMatch[1].trim();
    }
  } else if (typeName === 'partnerMembershipUpdate' && typeof rawContent === 'string') {
    const byMatch = rawContent.match(/\sby\s+(.+?)\.?$/);
    if (byMatch) {
      actorDisplayName = byMatch[1].trim();
    } else if (n.organizationName ?? n.OrganizationName) {
      actorDisplayName = String(n.organizationName ?? n.OrganizationName);
    }
  }
  return {
    id: n.id,
    /** Recipient user id (REST/SignalR); used to ignore misrouted hub payloads. */
    userId: n.userId ?? n.UserId,
    type: typeName,
    content: rawContent,
    isRead: n.isRead ?? false,
    createdAt: n.createdAt ?? n.CreatedAt ?? null,
    timestamp: n.createdAt ? formatNotificationTimestamp(n.createdAt, 'EN') : '',
    user: {
      id: n.actorId ?? '',
      name: actorDisplayName,
      handle: '',
      profileSlug: n.actorProfileSlug ?? n.actorId ?? '',
      avatar: null,
    },
    actorId: normalizeGuidish(n.actorId ?? n.ActorId),
    actorProfileSlug: normalizeGuidish(n.actorProfileSlug ?? n.ActorProfileSlug),
    postId: normalizeGuidish(n.postId ?? n.PostId),
    commentId: normalizeGuidish(n.commentId ?? n.CommentId),
    eventId: normalizeGuidish(n.eventId ?? n.EventId),
    organizationId,
    partnerInviteId,
    partnerJoinRequestId,
    platformSupportInquiryId,
    inquiryKind: typeName === 'platformSupportInquiry'
      ? parsePlatformSupportInquiryKind(rawContent)
      : null,
    organizationName: n.organizationName ?? n.OrganizationName,
  };
}

/**
 * Localizes API notification body text (English from server) for display.
 * @param {string | undefined} content
 * @param {'EN' | 'DE'} language
 */
export function localizeNotificationContent(content, language) {
  if (!content || typeof content !== 'string') {
    return content ?? '';
  }
  const text = content.trim();
  if (language === 'DE') {
    const patterns = [
      [/^(.+?)\s+commented on your post\.?$/i, '$1 hat Ihren Beitrag kommentiert'],
      [/^(.+?)\s+liked your post\.?$/i, '$1 gefällt Ihr Beitrag'],
      [/^(.+?)\s+reposted your post\.?$/i, '$1 hat Ihren Beitrag geteilt'],
      [/^(.+?)\s+viewed your profile\.?$/i, '$1 hat Ihr Profil angesehen'],
      [/^Reminder:\s*"([^"]+)"\s+is tomorrow\.?$/i, 'Erinnerung: „$1" ist morgen.'],
      [/^Reminder:\s*"([^"]+)"\s+is in one week\.?$/i, 'Erinnerung: „$1" ist in einer Woche.'],
      [/^New support request from (.+?)\.?$/i, 'Neue Support-Anfrage von $1'],
      [/^New feedback request from (.+?)\.?$/i, 'Neue Rückmeldung von $1'],
    ];
    for (const [re, template] of patterns) {
      const m = text.match(re);
      if (m) {
        return template.replace(/\$1/g, m[1]);
      }
    }
    return text;
  }
  return text.replace(/\breposted your post\b/i, 'shared your post');
}

/**
 * Relative timestamp for notification lists (compact: 5h ago / vor 5 Std.).
 * @param {string | Date | null | undefined} iso
 * @param {'EN' | 'DE'} language
 */
export function formatNotificationTimestamp(iso, language) {
  const d = parseUtcIso(iso);
  if (!d) {
    return '';
  }
  const lang = language === 'DE' ? 'DE' : 'EN';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60_000) {
    return t(lang, 'time.justNow');
  }
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMins < 60) {
    return tParams(lang, 'time.minutesAgo', { n: diffMins });
  }
  if (diffHours < 24) {
    return tParams(lang, 'time.hoursAgo', { n: diffHours });
  }
  if (diffDays < 7) {
    if (diffDays === 1 && lang === 'DE') {
      return t(lang, 'time.oneDayAgoDe');
    }
    if (lang === 'EN') {
      return tParams(lang, 'time.daysAgoCompact', { n: diffDays });
    }
    return tParams(lang, 'time.daysAgo', { n: diffDays });
  }
  return d.toLocaleDateString(lang === 'DE' ? 'de-DE' : 'en-US');
}

/** @param {{ createdAt?: string | null, timestamp?: string }} notification @param {'EN' | 'DE'} language */
export function getNotificationDisplayTimestamp(notification, language) {
  if (notification?.createdAt) {
    return formatNotificationTimestamp(notification.createdAt, language);
  }
  return notification?.timestamp ?? '';
}
