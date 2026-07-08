import { messagesPath, profilePath, postPath, partnerPath } from '@/lib/appRoutes';
import { normalizeGuidish } from '@/services/notificationService';

/** @param {string | undefined} id */
function isUsableRouteId(id) {
  if (!id) {
    return false;
  }
  const lower = String(id).trim().toLowerCase();
  return lower !== 'null' && lower !== 'undefined';
}

/**
 * @param {{ actorId?: string, actorProfileSlug?: string, user?: { id?: string, profileSlug?: string, handle?: string } }} notification
 * @returns {string | undefined}
 */
function resolveProfileIdentifier(notification) {
  const actorId = normalizeGuidish(notification.actorId ?? notification.user?.id);
  const slug = normalizeGuidish(
    notification.actorProfileSlug
      ?? notification.user?.profileSlug
      ?? notification.user?.handle,
  );
  const identifier = slug ?? actorId;
  return isUsableRouteId(identifier) ? identifier : undefined;
}

/**
 * Returns the route to navigate to for a given notification.
 * Shared by Notifications page and NotificationDropdown to keep routing logic in one place.
 * Prefer actorProfileSlug over actorId for profile routes to avoid "Invalid user" when the
 * profile API expects handle/slug format.
 * @param {{ type: string, actorId?: string, actorProfileSlug?: string, postId?: string, eventId?: string, organizationId?: string, user?: { profileSlug?: string, handle?: string, id?: string } }} notification
 * @returns {{ path: string, state?: object }}
 */
export function getNotificationRoute(notification) {
  const actorId = normalizeGuidish(notification.actorId ?? notification.user?.id);
  const postId = normalizeGuidish(notification.postId);
  const eventId = normalizeGuidish(notification.eventId);
  const organizationId = normalizeGuidish(notification.organizationId);
  const profileIdentifier = resolveProfileIdentifier(notification);

  switch (notification.type) {
  case 'like':
  case 'comment':
  case 'repost':
  case 'mention':
  case 'commentLike':
  case 'pinComment':
  case 'replyComment':
    return { path: isUsableRouteId(postId) ? postPath(postId) : '#' };
  case 'messageMention':
    return isUsableRouteId(actorId) ? { path: messagesPath(actorId) } : { path: '#' };
  case 'follow':
  case 'connect':
  case 'connectionRequest':
  case 'connectionAccepted':
  case 'profileView':
    return { path: profileIdentifier ? profilePath(profileIdentifier) : '#' };
  case 'event':
    return { path: isUsableRouteId(eventId) ? `/event/${encodeURIComponent(eventId)}` : '/events' };
  case 'partnerInvite':
    if (!isUsableRouteId(organizationId)) {
      return { path: '#' };
    }
    return {
      path: partnerPath(organizationId),
      state: {
        highlightPendingInvite: true,
        ...(notification.partnerInviteId
          ? { partnerInviteId: String(notification.partnerInviteId) }
          : {}),
      },
    };
  case 'partnerJoinRequest':
    if (!isUsableRouteId(organizationId)) {
      return { path: '#' };
    }
    return {
      path: partnerPath(organizationId),
      state: {
        highlightJoinRequest: true,
        ...(notification.partnerJoinRequestId
          ? { partnerJoinRequestId: String(notification.partnerJoinRequestId) }
          : {}),
        ...(notification.user?.name
          ? { joinRequestRequesterName: String(notification.user.name) }
          : {}),
      },
    };
  case 'partnerInviteAccepted':
  case 'partnerInviteDeclined':
  case 'partnerMembershipUpdate':
    return isUsableRouteId(organizationId)
      ? { path: partnerPath(organizationId) }
      : { path: '#' };
  case 'platformSupportInquiry':
    return {
      path: '/support/inbox',
      state: notification.platformSupportInquiryId
        ? { openSupportInquiryId: String(notification.platformSupportInquiryId) }
        : undefined,
    };
  default:
    return { path: '#' };
  }
}
