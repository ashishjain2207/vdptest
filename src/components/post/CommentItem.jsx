import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback, Button, Textarea } from '@imriva/framework';
import { Heart, Reply, Pin, BadgeCheck, Send, MoreHorizontal, Trash2, Pencil, Flag } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';
import { PostContent } from './PostContent';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useT, useTParams } from '@/i18n';
import { ReportContentDialog } from '@/components/moderation/ReportContentDialog';

/** Direct replies shown before "View more" at the post’s top-level comment list. */
const PREVIEW_REPLY_LIMIT = 2;
/** Nested threads are narrower: show 1 reply first so 2+ siblings under any reply still get “View more” (root uses 2 previews, so 3+ siblings needed there). */
const NESTED_PREVIEW_REPLY_LIMIT = 1;

export function CommentItem({ comment, depth = 0, currentUser, onLike, onReply, onPin, canPin, onDelete, canDelete, onEdit, canEdit, canReport, isPostAuthor }) {
  const { language } = useLanguage();
  const { contentReportsEnabled } = useFeatureFlags();
  const showReport = Boolean(canReport && contentReportsEnabled);
  const t = useT();
  const tr = useTParams();
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likes, setLikes] = useState(comment.likes);
  useEffect(() => {
    setIsLiked(comment.isLiked);
    setLikes(comment.likes ?? 0);
  }, [comment.isLiked, comment.likes]);

  useEffect(() => {
    setRepliesExpanded(false);
  }, [comment.id]);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content ?? '');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const replyTextareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const editTextareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const replyMention = useMentionSuggestions({
    content: replyContent,
    setContent: setReplyContent,
    inputRef: replyTextareaRef,
    currentUserId: currentUser?.userId,
  });
  const editMention = useMentionSuggestions({
    content: editContent,
    setContent: setEditContent,
    inputRef: editTextareaRef,
    currentUserId: currentUser?.userId,
  });

  const handleLike = async () => {
    if (!onLike) {return;}
    const newLiked = !isLiked;
    const prevLiked = isLiked;
    const prevLikes = likes;
    setIsLiked(newLiked);
    setLikes(newLiked ? likes + 1 : Math.max(0, likes - 1));
    try {
      await onLike(comment.id, newLiked);
    } catch (_err) {
      setIsLiked(prevLiked);
      setLikes(prevLikes);
    }
  };

  const handleReplySubmit = async () => {
    if (!onReply || !replyContent.trim()) {return;}
    setSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyInput(false);
    } finally {
      setSubmitting(false);
    }
  };

  const maxDepth = Number.POSITIVE_INFINITY;
  const isNested = depth > 0;
  const canNest = depth < maxDepth;
  const visualDepth = Math.min(depth, 2);
  const allReplies = comment.replies ?? [];
  const previewLimit = depth > 0 ? NESTED_PREVIEW_REPLY_LIMIT : PREVIEW_REPLY_LIMIT;
  const needsReplyCollapse = allReplies.length > previewLimit;
  const previewReplies = allReplies.slice(0, previewLimit);
  const overflowReplies = allReplies.slice(previewLimit);
  const hiddenReplyCount = needsReplyCollapse && !repliesExpanded ? overflowReplies.length : 0;
  const avatar = currentUser?.avatarUrl ?? currentUser?.avatar;
  const displayName = currentUser?.name ?? currentUser?.displayName ?? 'You';
  const fallbackClass = 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium';

  return (
    <div className={cn(
      'animate-fade-in',
      visualDepth > 0 && 'ml-12 border-l-2 border-border pl-4',
    )} data-testid="comment-item" data-comment-id={String(comment.id ?? '')}>
      <div className="flex gap-3 py-4">
        <Avatar className={cn('flex-shrink-0', isNested ? 'w-8 h-8' : 'w-10 h-10')}>
          {comment.author?.avatar ? (
            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          ) : null}
          <AvatarFallback className={fallbackClass}>{getInitials(comment.author?.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm hover:underline cursor-pointer">
                {comment.author.name}
              </span>
              {comment.author.isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/20" />
              )}
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{comment.timestamp}</span>
              {comment.isPinned && (
                <Pin className="w-3.5 h-3.5 text-primary -rotate-45 shrink-0" title="Pinned" />
              )}
            </div>
            {(canPin || canDelete || canEdit || showReport) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="comment-actions-trigger"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('posts.comment_actions')}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canPin && onPin && !comment.isPinned && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin(comment.id);
                      }}
                    >
                      <Pin className="w-3.5 h-3.5 mr-2" />
                      <LangText path="posts.pin_comment"  />
                    </DropdownMenuItem>
                  )}
                  {canPin && onPin && comment.isPinned && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin(null);
                      }}
                    >
                      <Pin className="w-3.5 h-3.5 mr-2" />
                      <LangText path="posts.unpin"  />
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) {
                          setEditContent(comment.content ?? '');
                          setEditing(true);
                        } else {
                          toast.info(t('toasts.editComingSoon'));
                        }
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      <LangText path="messages.edit"  />
                    </DropdownMenuItem>
                  )}
                  {canDelete && onDelete && (
                    <DropdownMenuItem
                      data-testid="comment-delete-action"
                      className="text-destructive focus:text-destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (deleting) {return;}
                        setDeleting(true);
                        try {
                          await onDelete(comment.id);
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      disabled={deleting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      <LangText path="messages.delete"  />
                    </DropdownMenuItem>
                  )}
                  {showReport ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportDialogOpen(true);
                      }}
                    >
                      <Flag className="w-3.5 h-3.5 mr-2" />
                      <LangText path="moderation.report" />
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editing && onEdit ? (
            <div className="mt-2 flex gap-2 animate-fade-in">
              <div className="relative flex-1">
                <Textarea
                  ref={editTextareaRef}
                  className="min-h-[60px] text-sm resize-y w-full"
                  value={editContent}
                  onChange={editMention.handleChange}
                  onKeyDown={editMention.handleKeyDown}
                  onBlur={editMention.handleBlur}
                  autoFocus
                />
                {editMention.MentionDropdown()}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  disabled={!editContent.trim() || editContent.trim() === (comment.content ?? '') || submitting}
                  onClick={async () => {
                    if (!editContent.trim()) {return;}
                    setSubmitting(true);
                    try {
                      await onEdit(comment, editContent.trim());
                      setEditing(false);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <LangText path="messages.save"  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(comment.content ?? '');
                  }}
                >
                  <LangText path="common.cancel"  />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm leading-relaxed">
              <PostContent content={comment.content} className="text-foreground" />
            </div>
          )}

          <div className="mt-2 flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2 gap-1.5 text-xs',
                isLiked
                  ? 'text-destructive'
                  : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
              )}
              onClick={handleLike}
            >
              <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
              {likes}
            </Button>

            {canNest && onReply && (
              <Button
                variant="ghost"
                size="sm"
                data-testid="comment-reply-toggle"
                className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <Reply className="w-3.5 h-3.5" />
                <LangText path="messages.reply"  />
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && onReply && (
            <div className="mt-3 flex gap-2 animate-fade-in">
              <Avatar className="w-7 h-7 flex-shrink-0">
                {avatar ? (
                  <AvatarImage src={avatar} alt={displayName} />
                ) : null}
                <AvatarFallback className={fallbackClass}>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex gap-1 items-start">
                  <div className="relative flex-1">
                    <Textarea
                      ref={replyTextareaRef}
                      placeholder={tr('time.replyTo', { name: comment.author.name })}
                      data-testid="comment-reply-input"
                      className="min-h-[60px] text-sm resize-y w-full"
                      value={replyContent}
                      onChange={replyMention.handleChange}
                      onKeyDown={replyMention.handleKeyDown}
                      onBlur={replyMention.handleBlur}
                    />
                    {replyMention.MentionDropdown()}
                  </div>
                  <EmojiPicker value={replyContent} onChange={setReplyContent} disabled={submitting} />
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyInput(false);
                      setReplyContent('');
                    }}
                  >
                    <LangText path="common.cancel"  />
                  </Button>
                  <Button
                    size="sm"
                    disabled={!replyContent.trim() || submitting}
                    data-testid="comment-reply-submit-button"
                    className="gap-1"
                    onClick={handleReplySubmit}
                  >
                    <Send className="w-3 h-3" />
                    <LangText path="messages.reply"  />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies: root previews 2 then View more; nested previews 1 so 2+ siblings still collapse */}
      {allReplies.length > 0 && (
        <div>
          {previewReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUser={currentUser}
              onLike={onLike}
              onReply={onReply}
              onPin={null}
              canPin={false}
              onDelete={onDelete}
              canDelete={Boolean(currentUser?.userId && (reply.authorId === currentUser.userId || isPostAuthor))}
              onEdit={onEdit}
              canEdit={Boolean(currentUser?.userId && reply.authorId === currentUser.userId)}
              canReport={Boolean(
                currentUser?.userId
                && reply.authorId
                && String(reply.authorId).toLowerCase() !== String(currentUser.userId).toLowerCase(),
              )}
              isPostAuthor={isPostAuthor}
            />
          ))}
          {hiddenReplyCount > 0 && (
            <div className="mt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto py-2 px-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setRepliesExpanded(true)}
              >
                {language === 'DE'
                  ? (hiddenReplyCount === 1 ? 'Weitere 1 Antwort anzeigen' : `Weitere ${hiddenReplyCount} Antworten anzeigen`)
                  : (hiddenReplyCount === 1 ? 'View 1 more reply' : `View ${hiddenReplyCount} more replies`)}
              </Button>
            </div>
          )}
          {needsReplyCollapse && repliesExpanded && (
            <div className="mt-1 mb-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto py-2 px-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setRepliesExpanded(false)}
              >
                <LangText path="posts.hide_replies"  />
              </Button>
            </div>
          )}
          {repliesExpanded &&
            overflowReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                currentUser={currentUser}
                onLike={onLike}
                onReply={onReply}
                onPin={null}
                canPin={false}
                onDelete={onDelete}
                canDelete={Boolean(currentUser?.userId && (reply.authorId === currentUser.userId || isPostAuthor))}
                onEdit={onEdit}
                canEdit={Boolean(currentUser?.userId && reply.authorId === currentUser.userId)}
                canReport={Boolean(
                  currentUser?.userId
                  && reply.authorId
                  && String(reply.authorId).toLowerCase() !== String(currentUser.userId).toLowerCase(),
                )}
                isPostAuthor={isPostAuthor}
              />
            ))}
        </div>
      )}
      {showReport ? (
        <ReportContentDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          contentType="Comment"
          contentId={String(comment.id ?? '')}
        />
      ) : null}
    </div>
  );
}
