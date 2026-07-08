/**
 * Comment view model shape for post comments.
 * Matches API response from GET /api/Comments/post/{postId}.
 * Use when mapping API CommentDto to UI or typing component props.
 *
 * @typedef {Object} CommentAuthor
 * @property {string} userId - User ID
 * @property {string} username - Handle (e.g. @username)
 * @property {string} [displayName] - Display name
 * @property {string} [avatarUrl] - Avatar URL
 * @property {boolean} [isVerified] - Verified badge
 *
 * @typedef {Object} CommentItemViewModel
 * @property {string} id - Comment ID
 * @property {string} postId - Post ID
 * @property {string} authorId - Author user ID
 * @property {string} [authorHandle] - Author handle
 * @property {string} [parentCommentId] - Parent comment ID (for replies)
 * @property {string} content - Comment text
 * @property {number} likesCount - Number of likes
 * @property {number} repliesCount - Number of replies
 * @property {boolean} isLiked - Whether current user liked this comment
 * @property {string} createdAt - ISO date string
 * @property {CommentAuthor|null} [author] - Author object (userId, username, displayName, avatarUrl, isVerified)
 * @property {CommentItemViewModel[]} replies - Nested replies (same shape, recursive)
 *
 * @typedef {Object} PostCommentsResponse
 * @property {CommentItemViewModel[]} data - Top-level comments
 * @property {number} page - Current page (1-based)
 * @property {number} pageSize - Page size
 * @property {number} totalCount - Total comment count
 * @property {number} totalPages - Total pages
 */

export const COMMENT_VIEW_MODEL_DOC = true;
