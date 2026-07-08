import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';

export const FEED_EVENTS = REALTIME.feed;

export function dispatchFeedEvent(type, detail = {}) {
  dispatchRealtime(type, detail);
}

/**
 * POST_ENGAGEMENT_UPDATED detail may include:
 * - `postId` — target post (required).
 * - From SignalR `PostEngagement` (camelCase): `actingUserId`, `engagementKind`, `repostsCount`, `repostedByActor`,
 *   `repostedAt`, `likesCount`, `likedByActor`, `commentsCount`, `bookmarkedByActor` — when present, feeds merge in place without refetching the full post.
 * - `refetchFeed: true` — optional full reload of page 1 (avoid for repost: it reorders and drops infinite-scroll pages).
 *
 * Dispatches POST_ENGAGEMENT_UPDATED for each post referenced by notifications.
 * Use after REST fetch when reconciling missed hub events (e.g. tab was backgrounded).
 * @param {Array<{ postId?: string }>} notifications
 */
export function dispatchPostEngagementForNotifications(notifications) {
  if (!Array.isArray(notifications) || typeof window === 'undefined') {
    return;
  }
  const seen = new Set();
  for (const n of notifications) {
    const id = n?.postId ?? n?.PostId;
    if (id && !seen.has(String(id).toLowerCase())) {
      seen.add(String(id).toLowerCase());
      dispatchRealtime(REALTIME.feed.POST_ENGAGEMENT_UPDATED, { postId: id });
    }
  }
}
