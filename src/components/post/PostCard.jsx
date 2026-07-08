import { Heart, MessageCircle, Repeat2, Share, Bookmark, MoreHorizontal, BadgeCheck, ExternalLink, Pencil, Trash2, MapPin, Check, Crown, Flag } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback, Button, Badge } from '@imriva/framework';
import { cn, getInitials } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { deletePost, votePoll, repostPost, unrepostPost, likePost, unlikePost, bookmarkPost, unbookmarkPost } from '@/services/postService';
import { getAccessToken, getUserIdFromToken } from '@/services/auth/authService.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PostContent, PostEmbeddedLinkFromContent } from './PostContent';
import { parsePostContent } from '@/lib/postContent';
import { PostMediaGrid } from '@/components/post/PostMediaGrid';
import { normalizePostMediaForDisplay } from '@/lib/postMedia';
import { ShareModal } from './ShareModal';
import { PartnerPostDeleteDialog } from './PartnerPostDeleteDialog';
import { PostCommentsInline } from './PostCommentsInline';
import { LangText } from '@/components/ui/LangText';
import { formatRelativeTimeAgo, partnerTierLabel, pollEndsInLine, resolvePostDisplayIdentity } from '@/lib/displayLabels';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { dispatchFeedEvent, FEED_EVENTS } from '@/lib/feedEvents';
import { postPath } from '@/lib/appRoutes';
import { mapApiPollToFeedPoll } from '@/lib/postMappers';
import { getMarketCountryLabel } from '@/lib/marketCountryCodes.js';
import { resolveCanModeratePartnerPost } from '@/lib/partnerModeration';
import { PostRepostAttribution } from '@/components/post/PostRepostAttribution';
import { ReportContentDialog } from '@/components/moderation/ReportContentDialog';

export function PostCard({
  post,
  onEdit,
  onDeleted,
  onPollVoted,
  onRepostChange,
  onUnbookmark,
  partnerFeedContext,
  hidePartnerTierBadge = false,
}) {

  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const { user: authUser } = useAuth();
  const { contentReportsEnabled } = useFeatureFlags();
  const authorId = post.authorId ?? post.author?.id ?? '';
  const isAuthor =
    Boolean(authorId && authUser?.userId) &&
    String(authorId).toLowerCase() === String(authUser.userId).toLowerCase();
  const canModeratePartnerPost = resolveCanModeratePartnerPost(post, {
    viewerUserId: partnerFeedContext?.viewerUserId ?? authUser?.userId,
    viewerPartnerRole: partnerFeedContext?.viewerPartnerRole,
    partnerOrganizationId: partnerFeedContext?.organizationId,
  });
  const canReportPost =
    contentReportsEnabled &&
    Boolean(authUser?.userId) &&
    !isAuthor;
  const showPostMenu = isAuthor || canModeratePartnerPost || canReportPost;
  const requiresModerationDeleteReason = canModeratePartnerPost && !isAuthor;
  const organizationIdRaw = post.organizationId ?? post.OrganizationId;
  const displayIdentity = resolvePostDisplayIdentity(post);
  const displayTimestamp =
    formatRelativeTimeAgo(post.createdAt ?? post.updatedAt, language) || post.timestamp;
  const postLocationFromContent = parsePostContent(post.content ?? '').location?.trim();
  const postDisplayLocation =
    postLocationFromContent || post.location?.trim() || post.author?.location?.trim() || '';
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [isReposted, setIsReposted] = useState(post.isReposted);
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [reposts, setReposts] = useState(post.reposts ?? 0);
  const [comments, setComments] = useState(post.comments ?? 0);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  /** When parent does not pass onPollVoted (e.g. some embeds), keep poll UI in sync after voting. */
  const [pollOverride, setPollOverride] = useState(null);
  const displayPoll = pollOverride ?? post.poll;
  const actionLabels = {
    comment: t('posts.toggle_comments'),
    repost: isReposted ? (t('posts.undo_repost')) : (t('posts.repost_post')),
    like: isLiked ? (t('posts.unlike_post')) : (t('posts.like_post')),
    share: t('posts.share_post'),
    bookmark: isBookmarked ? (t('posts.removeFromSaved')) : (t('posts.savePost')),
  };

  useEffect(() => {
    setPollOverride(null);
  }, [post.id]);

  useEffect(() => {
    setIsLiked(post.isLiked);
    setIsBookmarked(post.isBookmarked);
    setIsReposted(post.isReposted);
    setLikes(post.likes ?? 0);
    setReposts(post.reposts ?? 0);
    setComments(post.comments ?? 0);
  }, [post.isLiked, post.isBookmarked, post.isReposted, post.likes, post.reposts, post.comments]);

  const handleInlineCommentsCountChange = useCallback((count) => {
    setComments(Number.isFinite(Number(count)) ? Number(count) : 0);
  }, []);

  const handleInlineCommentAdded = useCallback(() => {
    setComments((c) => c + 1);
  }, []);

  const handleInlineCommentRemoved = useCallback(() => {
    setComments((c) => Math.max(0, c - 1));
  }, []);

  const handleLike = async (e) => {
    e.stopPropagation();
    const postId = post.id ?? post.Id;
    if (!postId) {return;}
    const newLiked = !isLiked;
    const prevLikes = likes;
    setIsLiked(newLiked);
    setLikes(newLiked ? likes + 1 : Math.max(0, likes - 1));
    try {
      if (newLiked) {
        await likePost(postId);
      } else {
        await unlikePost(postId);
      }
      toast(newLiked ? (t('posts.post_liked')) : (t('posts.like_removed')), { duration: 1500 });
      const token = getAccessToken();
      const actingUserId = token ? getUserIdFromToken(token) : null;
      const nextLikes = newLiked ? likes + 1 : Math.max(0, likes - 1);
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, {
        postId,
        actingUserId,
        engagementKind: newLiked ? 'Like' : 'Unlike',
        likesCount: nextLikes,
        likedByActor: newLiked,
      });
    } catch (err) {
      setIsLiked(!newLiked);
      setLikes(prevLikes);
      toast.error(err?.message ?? (t('posts.failed_to_like')));
    }
  };

  const handleRepost = async (e) => {
    e?.stopPropagation?.();
    const postId = post.id ?? post.Id;
    if (!postId) {return;}
    const newReposted = !isReposted;
    const prevReposts = reposts;
    setIsReposted(newReposted);
    setReposts(newReposted ? reposts + 1 : Math.max(0, reposts - 1));
    try {
      if (newReposted) {
        await repostPost(postId);
      } else {
        await unrepostPost(postId);
      }
      onRepostChange?.();
      toast(newReposted ? (t('posts.reposted_to_your_profile')) : (t('posts.repost_removed')), { duration: 1500 });
      const token = getAccessToken();
      const actingUserId = token ? getUserIdFromToken(token) : null;
      const nextReposts = newReposted ? reposts + 1 : Math.max(0, reposts - 1);
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, {
        postId,
        actingUserId,
        engagementKind: newReposted ? 'Repost' : 'Unrepost',
        repostedByActor: newReposted,
        repostsCount: nextReposts,
      });
    } catch (err) {
      setIsReposted(!newReposted);
      setReposts(prevReposts);
      toast.error(err?.message ?? (t('posts.failed_to_repost')));
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    const postId = post.id ?? post.Id;
    if (!postId) {return;}
    const newBookmarked = !isBookmarked;
    try {
      if (newBookmarked) {
        await bookmarkPost(postId);
      } else {
        await unbookmarkPost(postId);
      }
      setIsBookmarked(newBookmarked);
      toast(
        newBookmarked
          ? (t('posts.added_to_saved_posts'))
          : (t('posts.removedFromSaved')),
        { duration: 1500 },
      );
      if (!newBookmarked && onUnbookmark) {
        onUnbookmark(postId);
      }
      dispatchFeedEvent(FEED_EVENTS.BOOKMARKS_CHANGED);
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
    } catch (err) {
      toast.error(err?.message ?? (t('posts.saveFailed')));
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShareModalOpen(true);
  };

  const formatNumber = (num) => {
    const n = Number(num);
    const safe = Number.isFinite(n) ? n : 0;
    if (safe >= 1000) {
      return `${(safe / 1000).toFixed(1)}K`;
    }
    return String(safe);
  };

  const handlePostClick = (e) => {
    // Prevent navigation when clicking on interactive elements
    const target = e.target;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('[data-comments-section]') ||
      target.closest('video') ||
      target.closest('audio') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'VIDEO' ||
      target.tagName === 'AUDIO'
    ) {
      return;
    }
    navigate(postPath(post.id), {
      state: {
        organizationId: organizationIdRaw ?? null,
        organizationHandle: post.organizationHandle ?? post.OrganizationHandle ?? null,
      },
    });
  };

  const intl =
    post.isInternationalHomeFeedItem === true ||
    post.IsInternationalHomeFeedItem === true;
  const intlCc = String(
    post.internationalSourceCountryCode ?? post.InternationalSourceCountryCode ?? '',
  ).trim();
  const intlRel = String(
    post.internationalRelationship ?? post.InternationalRelationship ?? '',
  ).trim().toLowerCase();
  const intlCountryName =
    intl && intlCc ? getMarketCountryLabel(intlCc, language) : '';
  const navigateToDisplayIdentity = (e) => {
    e.stopPropagation();
    if (displayIdentity.navigationPath) {
      navigate(displayIdentity.navigationPath);
    }
  };

  return (
    <>
      <article 
        data-testid="post-card"
        data-post-id={String(post.id ?? post.Id ?? '')}
        className={cn(
          'bg-card rounded-xl border p-4 hover:shadow-card transition-all duration-200 animate-fade-in cursor-pointer',
          post.isRepost ? 'border-l-4 border-l-primary border-border' : 'border-border',
        )}
        onClick={handlePostClick}
      >
        {intl && intlCc ? (
          <div
            className="mb-3 rounded-md border border-border/70 bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            role="note"
          >
            {intlRel === 'connection'
              ? (language === 'EN'
                ? `🌍 From your connection in ${intlCountryName}`
                : `🌍 Von Ihrer Verbindung in ${intlCountryName}`)
              : intlRel === 'self'
                ? (language === 'EN'
                  ? `🌍 Your post from ${intlCountryName}`
                  : `🌍 Ihr Beitrag aus ${intlCountryName}`)
                : (language === 'EN'
                  ? `🌍 From someone you follow in ${intlCountryName}`
                  : `🌍 Von jemandem, dem Sie folgen, in ${intlCountryName}`)}
          </div>
        ) : null}
        <div className="flex gap-3">
          {/* Avatar — partner org posts link to partner page; personal posts link to profile */}
          <div
            role="button"
            tabIndex={0}
            onClick={navigateToDisplayIdentity}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigateToDisplayIdentity(e);
              }
            }}
            className="flex-shrink-0 cursor-pointer"
          >
            <Avatar className="w-11 h-11 hover-scale">
              {displayIdentity.avatar ? (
                <AvatarImage src={displayIdentity.avatar} alt={displayIdentity.name} />
              ) : null}
              <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                {getInitials(displayIdentity.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {post.isRepost && (
              <PostRepostAttribution reposter={post.reposter} currentUserId={authUser?.userId} />
            )}
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={navigateToDisplayIdentity}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigateToDisplayIdentity(e);
                    }
                  }}
                  className="flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <span className="font-semibold text-foreground">
                    {displayIdentity.name}
                  </span>
                  {displayIdentity.partnerTier && !hidePartnerTierBadge ? (
                    <span
                      className={cn(
                        'shrink-0 text-[10px] px-1.5 py-0 gap-0.5 inline-flex items-center',
                        displayIdentity.partnerTier === 'Premium' ? 'partner-premium-badge' : 'partner-standard-badge',
                      )}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {displayIdentity.partnerTier === 'Premium' ? (
                        <Crown className="w-3 h-3 text-amber-600 shrink-0" aria-hidden />
                      ) : null}
                      {partnerTierLabel(displayIdentity.partnerTier, language)}
                    </span>
                  ) : null}
                  {displayIdentity.showUserVerified && (
                    <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                  )}
                </div>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{displayTimestamp}</span>
              </div>
              {showPostMenu ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="post-actions-trigger" className="h-8 w-8 -mr-2 -mt-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0" onClick={(e) => e.stopPropagation()} aria-label={t('posts.post_actions')}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      {isAuthor ? (
                        <DropdownMenuItem data-testid="post-edit-action" onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          <LangText path="messages.edit"  />
                        </DropdownMenuItem>
                      ) : null}
                      {(isAuthor || canModeratePartnerPost) ? (
                        <DropdownMenuItem
                          data-testid="post-delete-action"
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <LangText path="messages.delete"  />
                        </DropdownMenuItem>
                      ) : null}
                      {canReportPost ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportDialogOpen(true);
                          }}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          <LangText path="moderation.report" />
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <PartnerPostDeleteDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    isAuthor={isAuthor}
                    requiresModerationReason={requiresModerationDeleteReason}
                    reasonFieldId={`delete-reason-${post.id ?? 'post'}`}
                    stopPropagationOnContent
                    onConfirm={async (reason) => {
                      const postId = post.id ?? post.Id;
                      await deletePost(postId, reason ? { reason } : {});
                      toast.success(t('posts.post_deleted'));
                      onDeleted?.(postId);
                      dispatchFeedEvent(FEED_EVENTS.POST_DELETED, { postId });
                    }}
                  />
                  {canReportPost ? (
                    <ReportContentDialog
                      open={reportDialogOpen}
                      onOpenChange={setReportDialogOpen}
                      contentType="Post"
                      contentId={String(post.id ?? post.Id ?? '')}
                    />
                  ) : null}
                </>
              ) : null}
            </div>

            {/* Body: Content → Poll → Media → Link → Location → Hashtags */}
            <div className="mt-1 space-y-3">
              <PostContent
                mainTextOnly
                className="text-foreground whitespace-pre-wrap break-words leading-relaxed"
                content={post.content}
                hideHashtagsInContent
              />

              {displayPoll && (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  {displayPoll.question && (
                    <p className="text-sm font-semibold text-foreground">{displayPoll.question}</p>
                  )}
                  {displayPoll.options.map((option, index) => {
                    const totalVotes = displayPoll.totalVotes || 0;
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    const maxVotes = Math.max(...displayPoll.options.map(o => o.votes || 0), 0);
                    const isWinning = totalVotes > 0 && option.votes === maxVotes;
                    const hasVoted = Boolean(displayPoll.userVotedOptionId);
                    const isUserVote = hasVoted && String(option.id) === String(displayPoll.userVotedOptionId);
                    const canVote = Boolean(displayPoll.id && option.id && authUser?.userId);
                    const handleVote = async (e) => {
                      e.stopPropagation();
                      if (!canVote) {return;}
                      try {
                        const updated = await votePoll(displayPoll.id, option.id);
                        if (!updated) {return;}
                        const mapped = mapApiPollToFeedPoll(updated);
                        if (mapped) {
                          if (onPollVoted) {
                            onPollVoted(post.id, updated);
                          } else {
                            setPollOverride(mapped);
                          }
                        }
                      } catch (err) {
                        toast.error(err?.message || (t('posts.failed_to_vote')));
                      }
                    };
                    return (
                      <button
                        key={option.id || index}
                        type="button"
                        onClick={handleVote}
                        disabled={!canVote}
                        className={cn(
                          'w-full relative rounded-lg border p-3 text-left transition-all overflow-hidden',
                          canVote && 'hover:border-primary bg-card cursor-pointer',
                          !canVote && 'cursor-default bg-card',
                          isUserVote ? 'border-primary ring-2 ring-primary/30' : 'border-border',
                        )}
                      >
                        <div 
                          className={cn(
                            'absolute inset-y-0 left-0 transition-all rounded-l-lg',
                            isUserVote ? 'bg-primary/20' : (isWinning ? 'bg-primary/10' : 'bg-muted'),
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="flex items-center justify-between gap-2 relative z-10">
                          <span className="text-sm font-medium text-foreground flex items-center gap-1.5 min-w-0">
                            {isUserVote && <Check className="w-4 h-4 shrink-0 text-primary" aria-hidden />}
                            <span className="truncate">{option.text}</span>
                          </span>
                          <span className={cn(
                            'text-sm font-semibold shrink-0',
                            isUserVote ? 'text-primary' : (isWinning ? 'text-primary' : 'text-foreground'),
                          )}>
                            {percentage}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <span>{(displayPoll.totalVotes || 0).toLocaleString()} <LangText path="posts.votes"  /></span>
                    <span>·</span>
                    <span>{pollEndsInLine(displayPoll.endsIn, language)}</span>
                  </div>
                </div>
              )}

              {(() => {
                const mediaItems = normalizePostMediaForDisplay(post);
                if (mediaItems.length === 0) {
                  return null;
                }
                return (
                  <PostMediaGrid
                    items={mediaItems}
                    layout={mediaItems.length === 1 ? 'single' : 'grid'}
                  />
                );
              })()}

              {post.linkPreview && (
                <a
                  href={post.linkPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border overflow-hidden hover:bg-accent/30 transition-colors group"
                >
                  <div className="aspect-[2/1] overflow-hidden">
                    <img
                      src={post.linkPreview.image}
                      alt={post.linkPreview.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <ExternalLink className="w-3 h-3" />
                      {post.linkPreview.domain}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {post.linkPreview.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {post.linkPreview.description}
                    </p>
                  </div>
                </a>
              )}

              {!post.linkPreview && (
                <PostEmbeddedLinkFromContent content={post.content} />
              )}

              {postDisplayLocation ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(postDisplayLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {postDisplayLocation}
                  </a>
                </div>
              ) : null}

              {/* Hashtags as badges only (click navigates to Explore); inline hashtags hidden via hideHashtagsInContent */}
              {(post.content && (post.content.match(/#\w+/g) || []).length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {(post.content.match(/#\w+/g) || []).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:underline transition-colors"
                    >
                      <Link to={`/explore/tag/${encodeURIComponent(tag.slice(1))}`} className="focus:outline-none">
                        {tag}
                      </Link>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between max-w-md -ml-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="post-comment-toggle"
                aria-label={actionLabels.comment}
                aria-expanded={commentsExpanded}
                className={cn(
                  'gap-1.5 h-8 px-2',
                  commentsExpanded
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCommentsExpanded((prev) => !prev);
                }}
              >
                <MessageCircle className="w-[18px] h-[18px]" />
                <span className="text-xs">{formatNumber(comments)}</span>
              </Button>

              <Button
                type="button"
                variant="ghost" 
                size="sm" 
                data-testid="post-repost-button"
                aria-label={actionLabels.repost}
                aria-pressed={isReposted}
                className={cn(
                  'gap-1.5 h-8 px-2',
                  isReposted 
                    ? 'text-success' 
                    : 'text-muted-foreground hover:text-success hover:bg-success/10',
                )}
                onClick={handleRepost}
              >
                <Repeat2 className="w-[18px] h-[18px]" />
                <span className="text-xs">{formatNumber(reposts)}</span>
              </Button>

              <Button
                type="button"
                variant="ghost" 
                size="sm" 
                data-testid="post-like-button"
                aria-label={actionLabels.like}
                aria-pressed={isLiked}
                className={cn(
                  'gap-1.5 h-8 px-2',
                  isLiked 
                    ? 'text-destructive' 
                    : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                )}
                onClick={handleLike}
              >
                <Heart className={cn('w-[18px] h-[18px]', isLiked && 'fill-current')} />
                <span className="text-xs">{formatNumber(likes)}</span>
              </Button>

              <Button
                type="button"
                variant="ghost" 
                size="sm" 
                data-testid="post-share-button"
                aria-label={actionLabels.share}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2"
                onClick={handleShare}
              >
                <Share className="w-[18px] h-[18px]" />
              </Button>

              <Button
                type="button"
                variant="ghost" 
                size="sm" 
                data-testid="post-bookmark-button"
                aria-label={actionLabels.bookmark}
                aria-pressed={isBookmarked}
                className={cn(
                  'h-8 px-2',
                  isBookmarked 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                )}
                onClick={handleBookmark}
              >
                <Bookmark className={cn('w-[18px] h-[18px]', isBookmarked && 'fill-current')} />
              </Button>
            </div>

            {/* Views */}
            <div className="mt-1 -ml-0.5">
              <span className="text-xs text-muted-foreground">{formatNumber(post.views)} <LangText path="posts.views"  /></span>
            </div>

            {/* Inline comments - expand without navigation; stop clicks from bubbling to post */}
            {commentsExpanded && (
              <div data-comments-section onClick={(e) => e.stopPropagation()}>
                <PostCommentsInline
                  postId={post.id ?? post.Id}
                  authUser={authUser}
                  isPostAuthor={isAuthor}
                  onCommentsCountChange={handleInlineCommentsCountChange}
                  onCommentAdded={handleInlineCommentAdded}
                  onCommentRemoved={handleInlineCommentRemoved}
                />
              </div>
            )}
          </div>
        </div>
      </article>

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        post={post}
      />
    </>
  );
}
