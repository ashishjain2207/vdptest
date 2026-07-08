import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/post/PostCard';
import { EditPostModal } from '@/components/post/EditPostModal';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getBookmarkedPosts, getPostById } from '@/services/postService';
import { mapApiPostToFeedPost, mapApiPollToFeedPoll } from '@/lib/postMappers';
import { FEED_EVENTS } from '@/lib/feedEvents';
import { engagementDetailHasMergeableFields, mergeFeedPostFromEngagementDetail } from '@/lib/postEngagementMerge';

const Bookmarks = () => {
  const { user: authUser } = useAuth();
  const t = useT();
  const currentUserAvatar = authUser?.avatarUrl ?? '';
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingPost, setEditingPost] = useState(null);
  const hasLoadedRef = useRef(false);

  const authUserAsAuthor = useMemo(() => (authUser ? { name: authUser.displayName, handle: authUser.handle, isVerified: authUser.isVerified } : { name: '', handle: '', isVerified: false }), [authUser]);

  const getSortTime = (p) => {
    const u = p.updatedAt ?? p.createdAt;
    if (!u) { return 0; }
    const d = typeof u === 'string' ? new Date(u) : u;
    return (d instanceof Date && !Number.isNaN(d.getTime())) ? d.getTime() : 0;
  };

  const handlePostUpdated = useCallback((updatedApiPost) => {
    if (!updatedApiPost) { return; }
    const mapped = mapApiPostToFeedPost(updatedApiPost, { useCurrentUserAsAuthor: true, currentUserAvatar, currentUser: authUserAsAuthor });
    const norm = (x) => String(x ?? '').toLowerCase();
    setBookmarkedPosts((prev) => {
      const next = prev.map((p) => (norm(p.id) === norm(mapped.id) ? mapped : p));
      return [...next].sort((a, b) => getSortTime(b) - getSortTime(a));
    });
    setEditingPost(null);
  }, [currentUserAvatar, authUserAsAuthor]);

  // Update post data in place (e.g. likes, comments). Do not reorder – only edit (updatedAt) should affect order.
  const mergePostEngagement = useCallback((postId, detail) => {
    if (!postId) {return;}
    if (engagementDetailHasMergeableFields(detail)) {
      const norm = (x) => String(x ?? '').toLowerCase();
      const sample = bookmarkedPosts.find((p) => norm(p.id) === norm(postId));
      const preview = sample
        ? mergeFeedPostFromEngagementDetail(sample, { ...detail, postId }, authUser?.userId)
        : null;
      if (preview) {
        setBookmarkedPosts((prev) =>
          prev.map((p) => {
            if (norm(p.id) !== norm(postId)) {return p;}
            const merged = mergeFeedPostFromEngagementDetail(p, { ...detail, postId }, authUser?.userId);
            return merged ?? p;
          }),
        );
        return;
      }
    }
    getPostById(postId)
      .then((apiPost) => {
        if (!apiPost) {return;}
        const mapped = mapApiPostToFeedPost(apiPost, { currentUserAvatar });
        const norm = (x) => String(x ?? '').toLowerCase();
        setBookmarkedPosts((prev) => prev.map((p) => (norm(p.id) === norm(postId) ? mapped : p)));
      })
      .catch(() => {});
  }, [authUser?.userId, currentUserAvatar, bookmarkedPosts]);

  useEffect(() => {
    const onEngagement = (e) => {
      if (e.detail?.refetchFeed) {
        setRefreshTrigger((t) => t + 1);
        return;
      }
      const postId = e.detail?.postId;
      if (postId) { mergePostEngagement(postId, e.detail); }
      else { setRefreshTrigger((t) => t + 1); }
    };
    const onRefresh = () => setRefreshTrigger((t) => t + 1);
    const onPostUpdated = (e) => {
      const postId = e.detail?.postId;
      if (postId) {
        getPostById(postId).then((apiPost) => {
          if (!apiPost) { return; }
          handlePostUpdated(apiPost);
        }).catch(() => {});
      }
    };
    window.addEventListener(FEED_EVENTS.BOOKMARKS_CHANGED, onRefresh);
    window.addEventListener(FEED_EVENTS.POST_DELETED, onRefresh);
    window.addEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    window.addEventListener(FEED_EVENTS.POST_UPDATED, onPostUpdated);
    return () => {
      window.removeEventListener(FEED_EVENTS.BOOKMARKS_CHANGED, onRefresh);
      window.removeEventListener(FEED_EVENTS.POST_DELETED, onRefresh);
      window.removeEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
      window.removeEventListener(FEED_EVENTS.POST_UPDATED, onPostUpdated);
    };
  }, [mergePostEngagement, handlePostUpdated]);

  useEffect(() => {
    if (!authUser) {
      setBookmarkedPosts([]);
      setTotalCount(0);
      setLoading(false);
      setError(null);
      hasLoadedRef.current = false;
      return;
    }
    let cancelled = false;
    const isSilentRefresh = hasLoadedRef.current;
    if (!isSilentRefresh) { setLoading(true); }
    setError(null);
    getBookmarkedPosts(1, 50, { showLoader: false })
      .then((data) => {
        if (cancelled) {return;}
        const raw = data?.data ?? data?.items ?? data;
        const items = Array.isArray(raw) ? raw : [];
        const mapped = items.map((p) => mapApiPostToFeedPost(p, { currentUserAvatar }));
        setBookmarkedPosts(mapped);
        setTotalCount(data?.totalCount ?? mapped.length);
        hasLoadedRef.current = true;
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? t('bookmarks.loadError'));
          setBookmarkedPosts([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) {setLoading(false);}
      });
    return () => { cancelled = true; };
  }, [authUser, currentUserAvatar, refreshTrigger, t]);

  const handleDeleted = useCallback((postId) => {
    setBookmarkedPosts((prev) => prev.filter((p) => String(p?.id) !== String(postId)));
    setTotalCount((c) => Math.max(0, c - 1));
  }, []);

  const handleUnbookmark = useCallback((postId) => {
    setBookmarkedPosts((prev) => prev.filter((p) => String(p?.id) !== String(postId)));
    setTotalCount((c) => Math.max(0, c - 1));
  }, []);

  const handlePollVoted = useCallback((postId, apiPoll) => {
    const mappedPoll = mapApiPollToFeedPoll(apiPoll);
    if (!mappedPoll) {return;}
    const norm = (x) => String(x ?? '').toLowerCase();
    setBookmarkedPosts((prev) =>
      prev.map((p) =>
        norm(p.id) === norm(postId) ? { ...p, poll: mappedPoll } : p,
      ),
    );
  }, []);

  return (
    <MainLayout>
      <EditPostModal
        open={Boolean(editingPost)}
        onOpenChange={(open) => !open && setEditingPost(null)}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground"><LangText path="bookmarks.title"  /></h1>
          <p className="text-muted-foreground mt-1">
            {loading ? '…' : totalCount} {totalCount === 1 ? <LangText path="bookmarks.savedPost"  /> : <LangText path="bookmarks.savedPosts"  />}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            <LangText path="common.loading_saved_posts"  />
          </div>
        )}

        {/* Bookmarked Posts */}
        {!loading && !error && bookmarkedPosts.length > 0 && (
          <div className="space-y-4" aria-label="Bookmarked posts list">
            {bookmarkedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={setEditingPost}
                onDeleted={handleDeleted}
                onUnbookmark={handleUnbookmark}
                onPollVoted={handlePollVoted}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bookmarkedPosts.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <BookmarkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2"><LangText path="bookmarks.empty"  /></h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              <LangText path="bookmarks.emptyHint"  />
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Bookmarks;
