import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getPostById, recordPostView, repostPost, unrepostPost, likePost, unlikePost, bookmarkPost, unbookmarkPost, deletePost, votePoll } from '@/services/postService';
import { getCommentsByPost, createComment, likeComment, unlikeComment, pinComment, unpinComment, deleteComment, updateComment } from '@/services/commentService';
import { PostContent, PostEmbeddedLinkFromContent } from '@/components/post/PostContent';
import { parsePostContent } from '@/lib/postContent';
import { mapApiPostToFeedPost, mapApiPollToFeedPoll } from '@/lib/postMappers';
import { dispatchFeedEvent, FEED_EVENTS } from '@/lib/feedEvents';
import { getAccessToken, getUserIdFromToken } from '@/services/auth/authService.js';
import { joinPostGroup, leavePostGroup, NOTIFICATIONS_HUB_RECONNECTED } from '@/services/notificationsHub';
import { getPartnerPosts } from '@/services/partnerService';
import { getInitials } from '@/lib/utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Textarea,
  Badge,
} from '@imriva/framework';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditPostModal } from '@/components/post/EditPostModal';
import { PartnerPostDeleteDialog } from '@/components/post/PartnerPostDeleteDialog';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  Bookmark, 
  MoreHorizontal, 
  BadgeCheck,
  ExternalLink,
  MapPin,
  Building,
  Send,
  Pencil,
  Trash2,
  Check,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShareModal } from '@/components/post/ShareModal';
import { EmojiPicker } from '@/components/post/EmojiPicker';
import { CommentItem } from '@/components/post/CommentItem';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { mapApiCommentToUi, sortCommentsForDisplay, countCommentsInTree } from '@/lib/commentMappers';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { formatRelativeTimeAgo, partnerTierLabel, pollEndsInLine, resolvePostDisplayIdentity } from '@/lib/displayLabels';
import { postMediaPath, postPath, feedPath } from '@/lib/appRoutes';
import { normalizePostMediaForDisplay } from '@/lib/postMedia';
import { FramedImage } from '@/components/media/FramedImage';
import { FEED_GRID_ASPECT_RATIO, FEED_WIDE_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { REALTIME } from '@/lib/realtimeEvents';

const PostDetail = () => {
  const { postId: postIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { language } = useLanguage();
  const t = useT();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsTotalCount, setCommentsTotalCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const commentsSectionRef = useRef(null);
  const replyTextareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const { handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, handleBlur: handleMentionBlur, MentionDropdown } = useMentionSuggestions({
    content: replyContent,
    setContent: setReplyContent,
    inputRef: replyTextareaRef,
    currentUserId: authUser?.userId,
  });

  const postId = post?.id ?? post?.Id ?? postIdParam;
  const partnerContextOrganizationId = location.state?.organizationId ?? null;

  const getPostByIdWithPartnerFallback = useCallback(async (id) => {
    let originalError = null;
    try {
      const directPost = await getPostById(id);
      if (directPost) {
        return directPost;
      }
    } catch (err) {
      originalError = err;
    }
    if (!partnerContextOrganizationId) {
      if (originalError) {
        throw originalError;
      }
      return null;
    }
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const partnerPosts = await getPartnerPosts(partnerContextOrganizationId, page, 100);
      const items = Array.isArray(partnerPosts?.data) ? partnerPosts.data : [];
      const matched = items.find((item) => String(item?.id ?? item?.Id ?? '') === String(id));
      if (matched) {
        return matched;
      }
      totalPages = Number(partnerPosts?.totalPages ?? 1);
      page += 1;
    }
    if (originalError) {
      throw originalError;
    }
    return null;
  }, [partnerContextOrganizationId]);

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchComments = useCallback(async ({ silent = false } = {}) => {
    if (!postId) {return;}
    if (!silent) {
      setCommentsLoading(true);
    }
    try {
      const res = await getCommentsByPost(postId, 1, 50, { showLoader: false });
      const mapped = (res.data ?? []).map((c) => mapApiCommentToUi(c, language));
      const tree = sortCommentsForDisplay(mapped);
      const nextCount = Math.max(res.totalCount ?? 0, countCommentsInTree(tree));
      setComments(tree);
      setCommentsTotalCount(nextCount);
      setPost((p) => (p ? { ...p, comments: nextCount } : p));
    } catch {
      setComments([]);
      setCommentsTotalCount(0);
    } finally {
      if (!silent) {
        setCommentsLoading(false);
      }
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {fetchComments();}
  }, [postId, fetchComments]);

  const handleAddComment = async () => {
    if (!postId || !replyContent.trim()) {return;}
    if (!authUser?.userId) {
      toast.error(t('toasts.loginToComment'));
      return;
    }
    setSubmittingComment(true);
    setPost((p) => (p ? { ...p, comments: (p.comments ?? 0) + 1 } : null));
    try {
      await createComment({
        postId,
        content: replyContent.trim(),
      });
      setReplyContent('');
      await fetchComments({ silent: true });
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
      toast.success(t('toasts.commentPosted'));
    } catch (err) {
      setPost((p) => (p ? { ...p, comments: Math.max(0, (p.comments ?? 0) - 1) } : null));
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
    setPost((p) => (p ? { ...p, comments: (p.comments ?? 0) + 1 } : null));
    try {
      await createComment({
        postId,
        parentCommentId,
        content: content.trim(),
      });
      await fetchComments({ silent: true });
      dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, { postId });
      toast.success(t('toasts.replyPosted'));
    } catch (err) {
      setPost((p) => (p ? { ...p, comments: Math.max(0, (p.comments ?? 0) - 1) } : null));
      toast.error(err?.message ?? t('toasts.failedPostReply'));
    }
  };

  const postAuthorId = post?.authorId ?? post?.author?.id ?? '';
  const isPostAuthor =
    Boolean(postAuthorId && authUser?.userId) &&
    String(postAuthorId).toLowerCase() === String(authUser.userId).toLowerCase();
  const canModeratePartnerPost = post?.canModeratePartnerPost === true || post?.CanModeratePartnerPost === true;
  const showPostMenu = isPostAuthor || canModeratePartnerPost;
  const requiresModerationDeleteReason = canModeratePartnerPost && !isPostAuthor;

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
      await fetchComments();
    } catch (err) {
      toast.error(err?.message ?? t('toasts.failedPin'));
    }
  };

  const handleEditComment = async (comment, newContent) => {
    if (!authUser?.userId || !newContent?.trim()) {return;}
    try {
      await updateComment(comment.id, { content: newContent.trim() });
      await fetchComments();
      toast.success(t('toasts.commentUpdated'));
    } catch (err) {
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
      await fetchComments();
    } catch (err) {
      toast.error(err?.message ?? t('toasts.failedLike'));
    }
  };

  const fetchPost = useCallback(() => {
    if (!postIdParam || !/^[0-9a-fA-F-]{36}$/.test(postIdParam)) {return;}
    getPostByIdWithPartnerFallback(postIdParam)
      .then((apiPost) => {
        if (apiPost) {
          const mapped = mapApiPostToFeedPost(apiPost);
          setPost(mapped);
        } else {
          setPost(null);
        }
      })
      .catch((err) => {
        setError(err.message);
        setPost(null);
      });
  }, [postIdParam, getPostByIdWithPartnerFallback]);

  useEffect(() => {
    if (!postIdParam) {
      setLoading(false);
      return;
    }
    if (!/^[0-9a-fA-F-]{36}$/.test(postIdParam)) {
      setLoading(false);
      setError('Invalid post ID');
      return;
    }
    setLoading(true);
    setError(null);
    getPostByIdWithPartnerFallback(postIdParam)
      .then((apiPost) => {
        if (apiPost) {
          const mapped = mapApiPostToFeedPost(apiPost);
          setPost(mapped);
          recordPostView(postIdParam).then((result) => {
            if (result?.viewsCount !== null && result?.viewsCount !== undefined && Number.isFinite(result.viewsCount)) {
              setPost((p) => (p ? { ...p, views: result.viewsCount } : null));
              dispatchFeedEvent(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, {
                postId: postIdParam,
                viewsCount: result.viewsCount,
              });
            } else if (result?.recorded) {
              setPost((p) => (p ? { ...p, views: (p.views ?? 0) + 1 } : null));
            }
          });
        } else {
          setPost(null);
        }
      })
      .catch((err) => {
        setError(err.message);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [postIdParam, getPostByIdWithPartnerFallback]);

  // Optional per-post hub group (engagement also broadcasts to the global feed group for all connections).
  // Re-join after SignalR reconnect in case server uses post-scoped events later.
  useEffect(() => {
    if (!postIdParam || !/^[0-9a-fA-F-]{36}$/.test(postIdParam)) {
      return;
    }
    const rejoin = () => { joinPostGroup(postIdParam); };
    rejoin();
    window.addEventListener(NOTIFICATIONS_HUB_RECONNECTED, rejoin);
    return () => {
      window.removeEventListener(NOTIFICATIONS_HUB_RECONNECTED, rejoin);
      leavePostGroup(postIdParam);
    };
  }, [postIdParam]);

  // Refetch when someone likes/reposts/comments on this post (real-time from SignalR)
  useEffect(() => {
    const matchesRoute = (evPostId) => {
      if (!evPostId || !postIdParam) { return false; }
      return String(evPostId).toLowerCase() === String(postIdParam).toLowerCase();
    };
    const onEngagement = (e) => {
      if (!matchesRoute(e.detail?.postId)) { return; }
      fetchPost();
      fetchComments();
    };
    const onPostUpdated = (e) => {
      if (!matchesRoute(e.detail?.postId)) { return; }
      fetchPost();
    };
    const onPostDeleted = (e) => {
      if (!matchesRoute(e.detail?.postId)) { return; }
      fetchPost();
    };
    window.addEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    window.addEventListener(FEED_EVENTS.POST_UPDATED, onPostUpdated);
    window.addEventListener(FEED_EVENTS.POST_DELETED, onPostDeleted);
    return () => {
      window.removeEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
      window.removeEventListener(FEED_EVENTS.POST_UPDATED, onPostUpdated);
      window.removeEventListener(FEED_EVENTS.POST_DELETED, onPostDeleted);
    };
  }, [postIdParam, fetchPost, fetchComments]);

  // Update comment like counts in place (no full refetch required).
  useEffect(() => {
    const matchesRoute = (evPostId) => {
      if (!evPostId || !postIdParam) { return false; }
      return String(evPostId).toLowerCase() === String(postIdParam).toLowerCase();
    };
    const onCommentEngagement = (e) => {
      const detail = e.detail ?? {};
      if (!matchesRoute(detail.postId ?? detail.PostId)) {
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
  }, [authUser?.userId, postIdParam]);

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likes, setLikes] = useState(0);
  const [reposts, setReposts] = useState(0);

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked ?? false);
      setIsBookmarked(post.isBookmarked ?? false);
      setIsReposted(post.isReposted ?? false);
      setLikes(post.likes ?? 0);
      setReposts(post.reposts ?? 0);
    }
  }, [post]);

  // Redirect to full-page media viewer when URL has ?media=0, ?media=1, etc. (images display in complete body, not modal)
  useEffect(() => {
    const mediaParam = searchParams.get('media');
    if (!postId || !post || mediaParam === null || mediaParam === '') { return; }
    const idx = parseInt(mediaParam, 10);
    if (Number.isNaN(idx) || idx < 0) { return; }
    const mediaList = normalizePostMediaForDisplay(post);
    if (idx < mediaList.length) {
      navigate(postMediaPath(postId, mediaList.length === 1 ? undefined : idx), { replace: true, state: { returnTo: postPath(postId) } });
    }
  }, [post, postId, searchParams, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <p className="text-muted-foreground"><LangText path="posts.loading_post"  /></p>
        </div>
      </MainLayout>
    );
  }

  if (!post || error) {
    const isServerError = error && (
      error.includes('processing your request') ||
      error.includes('Internal Server Error') ||
      error.includes('Failed to load')
    );
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isServerError ? <LangText path="posts.something_went_wrong"  /> : <LangText path="posts.post_not_found"  />}
          </h1>
          <p className="text-muted-foreground mb-4">
            {isServerError
              ? <LangText path="posts.the_server_encountered_an_error_ensure_the_api_is_running_an"  />
              : <LangText path="posts.the_post_youre_looking_for_doesnt_exist"  />}
          </p>
          {error && (
            <p className="text-sm text-muted-foreground mb-4 font-mono max-w-md mx-auto break-words">
              {error}
            </p>
          )}
          <Button onClick={() => navigate(feedPath)}><LangText path="posts.back_to_home"  /></Button>
        </div>
      </MainLayout>
    );
  }

  const postLocationFromContent = parsePostContent(post.content ?? '').location?.trim();
  const postDisplayLocation =
    postLocationFromContent || post.location?.trim() || post.author?.location?.trim() || '';

  const handleLike = async () => {
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
      toast.error(err?.message ?? t('toasts.failedLike'));
    }
  };

  const handleBookmark = async () => {
    if (!postId) {return;}
    const newBookmarked = !isBookmarked;
    try {
      if (newBookmarked) {
        await bookmarkPost(postId);
      } else {
        await unbookmarkPost(postId);
      }
      setIsBookmarked(newBookmarked);
      toast(newBookmarked ? (t('posts.added_to_saved_posts')) : (t('posts.removedFromSaved')), { duration: 1500 });
    } catch (err) {
      toast.error(err?.message ?? (t('posts.failed_to_save_post')));
    }
  };


  const handleRepost = async () => {
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

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)  }K`;
    }
    return num.toString();
  };

  const hashtags = post?.content ? (post.content.match(/#\w+/g) || []) : [];

  const displayIdentity = post ? resolvePostDisplayIdentity(post) : null;
  const displayTimestamp = post
    ? formatRelativeTimeAgo(post.createdAt ?? post.updatedAt, language) || post.timestamp
    : '';

  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto" data-testid="post-detail-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Full-width column so post uses complete UI (no half-half layout) */}
          <div className="lg:col-span-12 space-y-4">
            {/* Header - no highlight when edit modal is open */}
            <div className="flex items-center gap-4 outline-none focus-within:outline-none [&_*]:outline-none [&_*]:focus:outline-none [&_*]:focus:ring-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 focus:outline-none focus:ring-0"
                onClick={() => navigate(-1)}
                aria-label={t('layout.back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground"><LangText path="posts.post"  /></h1>
            </div>

            {/* Post Card – full width of main column like feed posts */}
            <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
              {/* Author Header - no focus ring when edit modal opens */}
              <div className="p-4 pb-0 [&_*]:outline-none [&_*]:focus:outline-none [&_*]:focus:ring-0">
                <div className="flex items-start justify-between">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (displayIdentity?.navigationPath) {
                        navigate(displayIdentity.navigationPath);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (displayIdentity?.navigationPath) {
                          navigate(displayIdentity.navigationPath);
                        }
                      }
                    }}
                    className="flex gap-3 cursor-pointer hover:opacity-90 transition-opacity flex-1 min-w-0"
                  >
                    <Avatar className="w-12 h-12 hover-scale shrink-0">
                      {displayIdentity?.avatar ? (
                        <AvatarImage src={displayIdentity.avatar} alt={displayIdentity.name} />
                      ) : null}
                      <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                        {getInitials(displayIdentity?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground hover:underline">
                          {displayIdentity?.name}
                        </span>
                        {displayIdentity?.partnerTier ? (
                          <span
                            className={cn(
                              'shrink-0 text-[10px] px-1.5 py-0 gap-0.5 inline-flex items-center',
                              displayIdentity.partnerTier === 'Premium' ? 'partner-premium-badge' : 'partner-standard-badge',
                            )}
                          >
                            {displayIdentity.partnerTier === 'Premium' ? (
                              <Crown className="w-3 h-3 text-amber-600 shrink-0" aria-hidden />
                            ) : null}
                            {partnerTierLabel(displayIdentity.partnerTier, language)}
                          </span>
                        ) : null}
                        {displayIdentity?.showUserVerified && (
                          <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                        {displayIdentity?.handle ? (
                          <span>@{displayIdentity.handle}</span>
                        ) : null}
                        {displayIdentity?.handle && displayTimestamp ? (
                          <span className="text-muted-foreground">·</span>
                        ) : null}
                        {displayTimestamp ? (
                          <span>{displayTimestamp}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {showPostMenu ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="post-detail-actions-trigger" className="h-8 w-8 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0" aria-label={t('posts.post_actions')}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isPostAuthor ? (
                            <DropdownMenuItem data-testid="post-detail-edit-action" onClick={() => setEditingPost(post)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              <LangText path="messages.edit"  />
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            data-testid="post-detail-delete-action"
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <LangText path="messages.delete"  />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <PartnerPostDeleteDialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                        isAuthor={isPostAuthor}
                        requiresModerationReason={requiresModerationDeleteReason}
                        reasonFieldId="post-detail-delete-reason"
                        onConfirm={async (reason) => {
                          const idToDelete = post.id ?? post.Id;
                          await deletePost(idToDelete, reason ? { reason } : {});
                          toast.success(t('posts.post_deleted'));
                          dispatchFeedEvent(FEED_EVENTS.POST_DELETED, { postId: idToDelete });
                          navigate(-1);
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              {/* Body: Content → Poll → Media → Link → Location → Hashtags */}
              <div className="p-4 space-y-4">
                <PostContent
                  mainTextOnly
                  className="text-foreground text-lg leading-relaxed whitespace-pre-wrap"
                  content={post.content}
                  hideHashtagsInContent
                />

                {post.poll && (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    {post.poll.question && (
                      <p className="text-sm font-semibold text-foreground">{post.poll.question}</p>
                    )}
                    {post.poll.options.map((option, index) => {
                      const totalVotes = post.poll.totalVotes || 0;
                      const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                      const maxVotes = Math.max(...post.poll.options.map(o => o.votes || 0), 0);
                      const isWinning = totalVotes > 0 && option.votes === maxVotes;
                      const hasVoted = Boolean(post.poll.userVotedOptionId);
                      const isUserVote = hasVoted && String(option.id) === String(post.poll.userVotedOptionId);
                      const canVote = post.poll.id && option.id && authUser?.userId;
                      const handlePollVote = async (e) => {
                        e.stopPropagation();
                        if (!canVote) {return;}
                        try {
                          const updated = await votePoll(post.poll.id, option.id);
                          if (updated) {
                            const mappedPoll = mapApiPollToFeedPoll(updated);
                            setPost((p) => p ? { ...p, poll: mappedPoll } : null);
                          }
                        } catch (err) {
                          toast.error(err?.message || (t('posts.failed_to_vote')));
                        }
                      };
                      return (
                        <button
                          key={option.id || index}
                          type="button"
                          onClick={handlePollVote}
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
                      <span>{(post.poll.totalVotes || 0).toLocaleString()} <LangText path="posts.votes"  /></span>
                      <span>·</span>
                      <span>{pollEndsInLine(post.poll.endsIn, language)}</span>
                    </div>
                  </div>
                )}

                {(() => {
                  const mediaItems = normalizePostMediaForDisplay(post);
                  if (mediaItems.length === 0) {
                    return null;
                  }
                  const gridClass = mediaItems.length === 1
                    ? 'rounded-xl overflow-hidden border border-border w-full'
                    : `rounded-xl overflow-hidden border border-border grid gap-0.5 w-full ${mediaItems.length === 2 ? 'grid-cols-2' : mediaItems.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`;
                  const openViewer = (idx) => {
                    navigate(postMediaPath(postId, mediaItems.length === 1 ? undefined : idx), { replace: true });
                  };
                  return (
                    <div className={gridClass}>
                      {mediaItems.map((item, idx) => {
                        if (item.kind === 'audio') {
                          return (
                            <div
                              key={`${item.url}-${idx}`}
                              className="p-3 bg-muted/40 space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <audio src={item.url} controls className="w-full" preload="metadata" />
                              <button
                                type="button"
                                onClick={() => openViewer(idx)}
                                className="text-xs text-primary hover:underline"
                              >
                                <LangText path="posts.open_in_media_viewer"  />
                              </button>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={`${item.url}-${idx}`}
                            type="button"
                            onClick={() => openViewer(idx)}
                            className={cn(
                              'text-left outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg overflow-hidden',
                              mediaItems.length === 1 ? 'block w-full' : 'aspect-square min-h-0 overflow-hidden',
                            )}
                          >
                            {item.kind === 'video' ? (
                              <video
                                src={item.url}
                                className={mediaItems.length === 1
                                  ? 'w-full h-auto min-h-[200px] max-h-[70vh] object-contain bg-muted/30'
                                  : 'w-full h-full object-cover'}
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <FramedImage
                                src={item.url}
                                variantUrls={item.imageVariantUrls}
                                imageDisplay={item.imageDisplay}
                                alt={`Post attachment ${idx + 1}`}
                                className={mediaItems.length === 1 ? 'w-full' : 'h-full w-full'}
                                frameClassName={mediaItems.length === 1 ? 'w-full' : 'h-full w-full'}
                                frameAspectRatio={mediaItems.length === 1 ? FEED_WIDE_ASPECT_RATIO : FEED_GRID_ASPECT_RATIO}
                                loading="lazy"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {post.linkPreview.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
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
                    >
                      {postDisplayLocation}
                    </a>
                  </div>
                ) : null}

                {/* Hashtags as badges only (click navigates to Explore); inline hashtags hidden via hideHashtagsInContent */}
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag, index) => (
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

                {/* Actions - same alignment as home page (PostCard): comments, reposts, likes with counts, then share, bookmark */}
                <div className="mt-3 flex items-center justify-between max-w-md -ml-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={scrollToComments}
                  >
                    <MessageCircle className="w-[18px] h-[18px]" />
                    <span className="text-xs">{formatNumber(commentsTotalCount ?? post.comments ?? 0)}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
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
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share className="w-[18px] h-[18px]" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
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

                {/* Views - same as home page */}
                <div className="mt-1 -ml-0.5">
                  <span className="text-xs text-muted-foreground">{formatNumber(post.views ?? 0)} <LangText path="posts.views"  /></span>
                </div>

                {/* Author company only – location is already in post body; date not repeated here */}
                {post.author?.company && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building className="w-4 h-4 shrink-0" />
                      <span>{post.author.company}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section - conversation + reply composer */}
            <div ref={commentsSectionRef} className="border-t border-border">
              <div className="p-4 pb-2">
                <h2 className="font-semibold text-foreground">
                  <LangText path="notifications.comments"  /> ({commentsLoading ? '...' : commentsTotalCount ?? comments.length})
                </h2>
              </div>

              {/* Reply Composer - multiline textarea with emoji picker */}
              {authUser ? (
                <div className="p-4 border-b border-border bg-secondary/20">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      {authUser?.avatarUrl ? (
                        <AvatarImage src={authUser.avatarUrl} alt={authUser?.name ?? 'You'} />
                      ) : null}
                      <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                        {getInitials(authUser?.name ?? authUser?.displayName ?? 'You')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-start">
                        <div className="relative flex-1">
                          <Textarea
                            ref={replyTextareaRef}
                            placeholder={t('posts.write_a_comment')}
                            data-testid="post-detail-comment-input"
                            className="min-h-[100px] resize-y bg-card w-full"
                            value={replyContent}
                            onChange={handleMentionChange}
                            onKeyDown={handleMentionKeyDown}
                            onBlur={handleMentionBlur}
                            rows={3}
                          />
                          {MentionDropdown()}
                        </div>
                        <EmojiPicker
                          value={replyContent}
                          onChange={setReplyContent}
                          disabled={submittingComment}
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          disabled={!replyContent.trim() || submittingComment}
                          data-testid="post-detail-comment-submit-button"
                          className="gap-2 shadow-soft"
                          onClick={handleAddComment}
                        >
                          <Send className="w-4 h-4" />
                          {submittingComment ? (t('posts.posting')) : (t('posts.post_comment'))}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-border bg-secondary/20">
                  <p className="text-muted-foreground text-sm py-2"><LangText path="posts.please_log_in_to_comment"  /></p>
                </div>
              )}
              {commentsLoading ? (
                <div className="flex justify-center py-8 text-muted-foreground text-sm"><LangText path="posts.loading_comments"  /></div>
              ) : (
                <div className="px-4 divide-y divide-border">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUser={authUser}
                      onLike={authUser ? handleCommentLike : undefined}
                      onReply={authUser ? handleReply : undefined}
                      onPin={isPostAuthor ? handlePinComment : undefined}
                      canPin={isPostAuthor}
                      onDelete={authUser ? handleDeleteComment : undefined}
                      canDelete={Boolean(authUser?.userId && (comment.authorId === authUser.userId || isPostAuthor))}
                      onEdit={authUser ? handleEditComment : undefined}
                      canEdit={Boolean(authUser?.userId && comment.authorId === authUser.userId)}
                      isPostAuthor={isPostAuthor}
                    />
                  ))}
                  {comments.length === 0 && !commentsLoading && (
                    <div className="py-8 text-center text-muted-foreground text-sm"><LangText path="posts.no_comments_yet_be_the_first_to_reply"  /></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditPostModal
        open={Boolean(editingPost)}
        onOpenChange={(open) => !open && setEditingPost(null)}
        post={editingPost}
        onPostUpdated={(updatedApi) => {
          if (updatedApi) {
            const mapped = mapApiPostToFeedPost(updatedApi);
            setPost(mapped);
          }
          setEditingPost(null);
        }}
      />
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        post={post}
      />
    </MainLayout>
  );
};

export default PostDetail;
