import { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback, Button, Textarea } from '@imriva/framework';
import { FEED_EVENTS, dispatchFeedEvent } from '@/lib/feedEvents';
import { joinPostGroup, leavePostGroup } from '@/services/notificationsHub';
import { Send } from 'lucide-react';
import { getCommentsByPost, createComment, likeComment, unlikeComment, pinComment, unpinComment, deleteComment, updateComment } from '@/services/commentService';
import { mapApiCommentToUi, sortCommentsForDisplay, countCommentsInTree } from '@/lib/commentMappers';
import { getInitials } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';
import { CommentItem } from './CommentItem';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { toast } from 'sonner';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { REALTIME } from '@/lib/realtimeEvents';
import { ModerationAlert } from '@/components/common/ModerationAlert';
import { getModerationErrorMessage, isModerationError } from '@/utils/moderationError';

const COMMENT_MODERATION_FALLBACK = 'This comment couldn’t be posted because it may violate platform rules. Please edit it and try again.';

/**
 * Inline comments section for PostCard - expands without navigation, loads on expand.
 * Counts: use `onCommentsCountChange` for authoritative totals after refetch. `onCommentRemoved` is only for rolling back
 * optimistic `onCommentAdded` when create/reply fails — not after delete (refetch already applies the new total).
 */
export function PostCommentsInline({ postId, authUser, isPostAuthor, onCommentAdded, onCommentRemoved, onCommentsCountChange }) {
  const { language } = useLanguage();
  const t = useT();
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [moderationError, setModerationError] = useState('');
  const commentTextareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const onCommentsCountChangeRef = useRef(onCommentsCountChange);
  const onCommentAddedRef = useRef(onCommentAdded);
  const onCommentRemovedRef = useRef(onCommentRemoved);

  useEffect(() => {
    onCommentsCountChangeRef.current = onCommentsCountChange;
  }, [onCommentsCountChange]);

  useEffect(() => {
    onCommentAddedRef.current = onCommentAdded;
  }, [onCommentAdded]);

  useEffect(() => {
    onCommentRemovedRef.current = onCommentRemoved;
  }, [onCommentRemoved]);

  const { handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, handleBlur: handleMentionBlur, MentionDropdown } = useMentionSuggestions({
    content: replyContent,
    setContent: setReplyContent,
    inputRef: commentTextareaRef,
    currentUserId: authUser?.userId,
  });

  const fetchComments = useCallback(async ({ silent = false } = {}) => {
    if (!postId) {return;}
    if (!silent) {
      setCommentsLoading(true);
    }
    try {
      const res = await getCommentsByPost(postId, 1, 50, { showLoader: false });
      const mapped = (res.data ?? []).map((c) => mapApiCommentToUi(c, language));
      const tree = sortCommentsForDisplay(mapped);
      const derivedCount = countCommentsInTree(tree);
      setComments(tree);
      onCommentsCountChangeRef.current?.(Math.max(res.totalCount ?? 0, derivedCount));
    } catch {
      setComments([]);
      onCommentsCountChangeRef.current?.(0);
    } finally {
      if (!silent) {
        setCommentsLoading(false);
      }
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) {return;}
    const t = setTimeout(() => fetchComments(), 0);
    return () => clearTimeout(t);
  }, [postId, fetchComments]);

  useEffect(() => {
    if (!postId) {return;}
    joinPostGroup(postId);
    return () => { leavePostGroup(postId); };
  }, [postId]);

  useEffect(() => {
    const onEngagement = (e) => {
      const evPostId = e.detail?.postId;
      if (!evPostId || !postId) {return;}
      if (String(evPostId).toLowerCase() === String(postId).toLowerCase()) {
        fetchComments({ silent: true });
      }
    };
    window.addEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    return () => window.removeEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
  }, [postId, fetchComments]);

  useEffect(() => {
    const onCommentEngagement = (e) => {
      const detail = e.detail ?? {};
      const evPostId = detail.postId ?? detail.PostId ?? null;
      if (!evPostId || !postId) {
        return;
      }
      if (String(evPostId).toLowerCase() !== String(postId).toLowerCase()) {
        return;
      }
      const commentId = detail.commentId ?? detail.CommentId ?? null;
      if (!commentId) {
        return;
      }
      const likesCountRaw = detail.likesCount ?? detail.LikesCount ?? null;
      const likesCount = likesCountRaw === null || likesCountRaw === undefined ? null : Number(likesCountRaw);
      if (likesCount === null || !Number.isFinite(likesCount)) {
        return;
      }
      const actingUserId = detail.actingUserId ?? detail.ActingUserId ?? null;
      const likedByActor = detail.likedByActor ?? detail.LikedByActor ?? null;
      const me = authUser?.userId ? String(authUser.userId).toLowerCase() : '';
      const actor = actingUserId ? String(actingUserId).toLowerCase() : '';
      const isSelf = Boolean(me && actor && me === actor);

      const patchTree = (node) => {
        if (!node) {
          return node;
        }
        const id = String(node.id ?? '');
        const isMatch = id && String(commentId).toLowerCase() === id.toLowerCase();
        const nextReplies = Array.isArray(node.replies) ? node.replies.map(patchTree) : node.replies;
        if (isMatch) {
          return {
            ...node,
            likes: likesCount,
            isLiked: isSelf && likedByActor !== null && likedByActor !== undefined ? Boolean(likedByActor) : node.isLiked,
            replies: nextReplies,
          };
        }
        if (nextReplies !== node.replies) {
          return { ...node, replies: nextReplies };
        }
        return node;
      };

      setComments((prev) => (Array.isArray(prev) ? prev.map(patchTree) : prev));
    };

    window.addEventListener(REALTIME.comments.COMMENT_ENGAGEMENT_UPDATED, onCommentEngagement);
    return () => window.removeEventListener(REALTIME.comments.COMMENT_ENGAGEMENT_UPDATED, onCommentEngagement);
  }, [authUser?.userId, postId]);

  const handleAddComment = async () => {
    if (!postId || !replyContent.trim()) {return;}
    if (!authUser?.userId) {
      toast.error(t('toasts.loginToComment'));
      return;
    }
    setSubmittingComment(true);
    setModerationError('');
    onCommentAddedRef.current?.();
    try {
      await createComment({ postId, content: replyContent.trim() });
      setReplyContent('');
      await fetchComments({ silent: true });
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
      toast.success(t('toasts.commentPosted'));
    } catch (err) {
      onCommentRemovedRef.current?.();
      if (isModerationError(err)) {
        setModerationError(getModerationErrorMessage(err, COMMENT_MODERATION_FALLBACK));
        return;
      }
      toast.error(err?.message ?? t('toasts.failedPostComment'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (parentCommentId, content) => {
    if (!postId || !content?.trim()) {return;}
    if (!authUser?.userId) {
      toast.error(t('toasts.loginToReply'));
      return;
    }
    onCommentAddedRef.current?.();
    try {
      await createComment({ postId, parentCommentId, content: content.trim() });
      await fetchComments({ silent: true });
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
      toast.success(t('toasts.replyPosted'));
    } catch (err) {
      onCommentRemovedRef.current?.();
      if (isModerationError(err)) {
        toast.error(getModerationErrorMessage(err, COMMENT_MODERATION_FALLBACK));
        return;
      }
      toast.error(err?.message ?? t('toasts.failedPostReply'));
    }
  };

  const handleCommentLike = async (commentId, isLiked) => {
    if (!authUser?.userId) {
      toast.error(t('toasts.loginToLike'));
      return;
    }
    try {
      if (isLiked) {
        await likeComment(commentId);
      } else {
        await unlikeComment(commentId);
      }
      await fetchComments({ silent: true });
    } catch (err) {
      toast.error(err?.message ?? t('toasts.failedLike'));
    }
  };

  const handlePinComment = async (commentIdOrNull) => {
    if (!postId || !authUser?.userId) {return;}
    try {
      if (commentIdOrNull) {
        await pinComment(postId, commentIdOrNull);
        toast.success(t('toasts.commentPinned'));
      } else {
        await unpinComment(postId);
        toast.success(t('toasts.commentUnpinned'));
      }
      await fetchComments({ silent: true });
    } catch (err) {
      toast.error(err?.message ?? t('toasts.failedPin'));
    }
  };

  const handleEditComment = async (comment, newContent) => {
    if (!authUser?.userId || !newContent?.trim()) {return;}
    try {
      await updateComment(comment.id, { content: newContent.trim() });
      await fetchComments({ silent: true });
      toast.success(t('toasts.commentUpdated'));
    } catch (err) {
      if (isModerationError(err)) {
        toast.error(getModerationErrorMessage(err, COMMENT_MODERATION_FALLBACK));
        return;
      }
      toast.error(err?.message ?? t('toasts.failedUpdate'));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!authUser?.userId) {return;}
    try {
      await deleteComment(commentId);
      await fetchComments({ silent: true });
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
      toast.success(t('toasts.commentDeleted'));
    } catch (err) {
      toast.error(err?.message ?? t('toasts.failedDelete'));
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border animate-fade-in">
      {/* Reply composer */}
      {authUser ? (
        <div className="flex gap-2 mb-4">
          <Avatar className="w-8 h-8 flex-shrink-0">
            {(authUser?.avatarUrl ?? authUser?.avatar) ? (
              <AvatarImage src={authUser?.avatarUrl ?? authUser?.avatar} alt={authUser?.name ?? 'You'} />
            ) : null}
            <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-xs font-medium">
              {getInitials(authUser?.name ?? authUser?.displayName ?? 'You')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {moderationError ? (
              <ModerationAlert
                message={moderationError}
                onDismiss={() => setModerationError('')}
              />
            ) : null}
            <div className="flex gap-1 items-start">
              <div className="relative flex-1">
                <Textarea
                  ref={commentTextareaRef}
                  placeholder={t('posts.write_a_comment')}
                  className="min-h-[72px] text-sm resize-y w-full bg-card"
                  value={replyContent}
                  onChange={handleMentionChange}
                  onKeyDown={handleMentionKeyDown}
                  onBlur={handleMentionBlur}
                  rows={2}
                />
                {MentionDropdown()}
              </div>
              <EmojiPicker value={replyContent} onChange={setReplyContent} disabled={submittingComment} />
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                disabled={!replyContent.trim() || submittingComment}
                className="gap-1"
                onClick={handleAddComment}
              >
                <Send className="w-3.5 h-3.5" />
                {submittingComment ? (t('posts.posting')) : (t('posts.post'))}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs mb-4"><LangText path="posts.please_log_in_to_comment"  /></p>
      )}

      {/* Comments list */}
      <div className="space-y-0">
        {commentsLoading ? (
          <div className="py-4 text-center text-muted-foreground text-xs"><LangText path="posts.loading_comments"  /></div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={authUser}
                onLike={authUser ? handleCommentLike : undefined}
                onReply={authUser ? handleReply : undefined}
                onPin={isPostAuthor && authUser ? handlePinComment : undefined}
                canPin={isPostAuthor}
                onDelete={authUser ? handleDeleteComment : undefined}
                canDelete={Boolean(authUser?.userId && (comment.authorId === authUser.userId || isPostAuthor))}
                onEdit={authUser ? handleEditComment : undefined}
                canEdit={Boolean(authUser?.userId && comment.authorId === authUser.userId)}
                canReport={Boolean(
                  authUser?.userId
                  && comment.authorId
                  && String(comment.authorId).toLowerCase() !== String(authUser.userId).toLowerCase(),
                )}
                isPostAuthor={isPostAuthor}
              />
            ))}
            {comments.length === 0 && !commentsLoading && (
              <div className="py-4 text-center text-muted-foreground text-xs"><LangText path="posts.no_comments_yet_be_the_first"  /></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
