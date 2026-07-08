/**
 * Merge realtime / REST post engagement payloads into feed post rows without refetching the full post when counts/flags are present.
 */

/**
 * @param {unknown} id
 * @returns {string}
 */
export function normalizeUserIdForCompare(id) {
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

/**
 * @param {unknown} detail
 * @returns {boolean}
 */
function isPresent(v) {
  return v !== null && v !== undefined;
}

/** True when detail includes at least one counter we can merge for every viewer (not actor-only flags). */
export function engagementDetailHasMergeableFields(detail) {
  if (!detail || typeof detail !== 'object') {
    return false;
  }
  return (
    isPresent(detail.repostsCount) ||
    isPresent(detail.RepostsCount) ||
    isPresent(detail.likesCount) ||
    isPresent(detail.LikesCount) ||
    isPresent(detail.commentsCount) ||
    isPresent(detail.CommentsCount) ||
    isPresent(detail.viewsCount) ||
    isPresent(detail.ViewsCount)
  );
}

function numOrNull(v) {
  if (v === null || v === undefined || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {object} post - feed post row
 * @param {object} detail - POST_ENGAGEMENT_UPDATED detail (camelCase or PascalCase from SignalR)
 * @param {string | null | undefined} currentUserId
 * @returns {object | null} merged post, or null if nothing applied
 */
export function mergeFeedPostFromEngagementDetail(post, detail, currentUserId) {
  if (!post || !detail || typeof detail !== 'object') {
    return null;
  }
  const pid = detail.postId ?? detail.PostId;
  if (!pid) {
    return null;
  }
  const norm = (x) => String(x ?? '').toLowerCase();
  if (norm(post.id) !== norm(pid)) {
    return null;
  }

  const patch = {};
  const rc = numOrNull(detail.repostsCount ?? detail.RepostsCount);
  if (rc !== null) {
    patch.reposts = rc;
  }
  const lc = numOrNull(detail.likesCount ?? detail.LikesCount);
  if (lc !== null) {
    patch.likes = lc;
  }
  const cc = numOrNull(detail.commentsCount ?? detail.CommentsCount);
  if (cc !== null) {
    patch.comments = cc;
  }
  const vc = numOrNull(detail.viewsCount ?? detail.ViewsCount);
  if (vc !== null) {
    patch.views = vc;
  }

  const me = currentUserId ? normalizeUserIdForCompare(currentUserId) : '';
  const actor = detail.actingUserId ?? detail.ActingUserId;
  const actorNorm = actor ? normalizeUserIdForCompare(actor) : '';
  const isSelf = Boolean(me && actorNorm && me === actorNorm);

  if (isSelf) {
    const rba = detail.repostedByActor ?? detail.RepostedByActor;
    if (isPresent(rba)) {
      patch.isReposted = Boolean(rba);
    }
    const lba = detail.likedByActor ?? detail.LikedByActor;
    if (isPresent(lba)) {
      patch.isLiked = Boolean(lba);
    }
    const bba = detail.bookmarkedByActor ?? detail.BookmarkedByActor;
    if (isPresent(bba)) {
      patch.isBookmarked = Boolean(bba);
    }
  }

  if (Object.keys(patch).length === 0) {
    return null;
  }
  return { ...post, ...patch };
}

/**
 * Own profile Reposts tab: insert on repost, remove on unrepost (no full list refetch).
 * @param {object} opts
 * @param {object} opts.detail
 * @param {string | undefined} opts.authUserId
 * @param {string | undefined} opts.profileUserId
 * @param {import('react').Dispatch<import('react').SetStateAction<any[]>>} opts.setUserReposts
 * @param {(id: string) => Promise<any>} opts.getPostById
 * @param {(api: any) => object} opts.mapApiPostToFeedPost
 * @returns {Promise<void>}
 */
export async function syncOwnProfileRepostsFromEngagement({
  detail,
  authUserId,
  profileUserId,
  setUserReposts,
  getPostById,
  mapApiPostToFeedPost,
}) {
  const postId = detail?.postId ?? detail?.PostId;
  if (!postId || !authUserId || !profileUserId) {
    return;
  }
  if (normalizeUserIdForCompare(authUserId) !== normalizeUserIdForCompare(profileUserId)) {
    return;
  }

  const actor = detail?.actingUserId ?? detail?.ActingUserId;
  if (normalizeUserIdForCompare(actor) !== normalizeUserIdForCompare(authUserId)) {
    return;
  }

  const kind = String(detail.engagementKind ?? detail.EngagementKind ?? '');
  const norm = (x) => String(x ?? '').toLowerCase();

  if (kind === 'Unrepost') {
    setUserReposts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
    return;
  }

  if (kind !== 'Repost') {
    return;
  }

  const rb = detail.repostedByActor ?? detail.RepostedByActor;
  if (rb === false) {
    return;
  }

  const apiPost = await getPostById(String(postId));
  if (!apiPost) {
    return;
  }
  const mapped = mapApiPostToFeedPost(apiPost);
  setUserReposts((prev) => {
    if (prev.some((p) => norm(p.id) === norm(postId))) {
      return prev;
    }
    return [mapped, ...prev];
  });
}
