import { parseUtcIso } from '@/lib/utils';
import { formatRelativeTimeAgo } from '@/lib/displayLabels';

/** Map API CommentDto to UI shape for CommentItem. */
export function mapApiCommentToUi(apiComment, language = 'EN') {
  const handle = (apiComment.authorHandle ?? apiComment.authorId ?? '').replace(/^@/, '') || 'user';
  const name = apiComment.authorDisplayName ?? handle;
  return {
    id: apiComment.id,
    authorId: apiComment.authorId ?? null,
    parentCommentId: apiComment.parentCommentId ?? apiComment.ParentCommentId ?? null,
    createdAt: apiComment.createdAt ? parseUtcIso(apiComment.createdAt) : null,
    author: {
      name,
      handle,
      avatar: apiComment.authorAvatarUrl || null,
      isVerified: apiComment.authorIsVerified ?? false,
    },
    content: apiComment.content ?? '',
    timestamp: formatRelativeTimeAgo(apiComment.createdAt, language),
    likes: apiComment.likesCount ?? 0,
    isLiked: apiComment.isLiked ?? false,
    isPinned: apiComment.isPinned ?? false,
    replies: (apiComment.replies ?? []).map((reply) => mapApiCommentToUi(reply, language)),
  };
}

function flattenComments(list, out = [], impliedParentId = null) {
  for (const comment of list ?? []) {
    if (!comment?.id) {
      continue;
    }
    const { replies = [], ...rest } = comment;
    const parentCommentId = rest.parentCommentId ?? impliedParentId ?? null;
    out.push({ ...rest, parentCommentId, replies: [] });
    if (Array.isArray(replies) && replies.length > 0) {
      flattenComments(replies, out, String(comment.id));
    }
  }
  return out;
}

/** One row per comment id (first DFS occurrence wins over duplicate top-level echoes). */
function dedupeFlattenedByCommentId(flattened) {
  const seen = new Set();
  const out = [];
  for (const comment of flattened) {
    const id = String(comment.id);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(comment);
  }
  return out;
}

function sortRepliesChronologically(list) {
  return [...list]
    .sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return aTime - bTime;
    })
    .map((comment) => ({
      ...comment,
      replies: sortRepliesChronologically(comment.replies ?? []),
    }));
}

/** Rebuild a stable nested tree even when the API returns a flat or partially nested list. */
export function buildCommentTree(list) {
  const flattened = dedupeFlattenedByCommentId(flattenComments(list));
  const nodes = new Map(
    flattened.map((comment) => [
      String(comment.id),
      { ...comment, replies: [] },
    ]),
  );
  const roots = [];

  for (const comment of flattened) {
    const node = nodes.get(String(comment.id));
    const parentId = comment.parentCommentId ? String(comment.parentCommentId) : null;
    const parent = parentId ? nodes.get(parentId) : null;
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return [...roots]
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) {return -1;}
      if (!a.isPinned && b.isPinned) {return 1;}
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    })
    .map((comment) => ({
      ...comment,
      replies: sortRepliesChronologically(comment.replies ?? []),
    }));
}

export function countCommentsInTree(list) {
  return (list ?? []).reduce(
    (sum, comment) => sum + 1 + countCommentsInTree(comment.replies ?? []),
    0,
  );
}

/** Sort top-level comments: pinned first, then newest first. */
export function sortCommentsForDisplay(list) {
  return buildCommentTree(list);
}
