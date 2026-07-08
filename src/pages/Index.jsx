import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePost } from '@/components/post/CreatePost';
import { PostCard } from '@/components/post/PostCard';
import { FeedPostSkeleton } from '@/components/post/FeedPostSkeleton';
import { EditPostModal } from '@/components/post/EditPostModal';
import { UserCard } from '@/components/user/UserCard';
import { UserCardSkeleton } from '@/components/user/UserCardSkeleton';
import { TrendingUp, Users, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@imriva/framework';
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import { getTrendingHashtags } from '@/services/trendingService';
import { getSuggestedPeople } from '@/services/suggestedPeopleService';
import { mapSuggestedPersonToUserCard } from '@/lib/userMappers';
import { getFeed, getPostById } from '@/services/postService';
import { subscribeAdminScopeFeedRefresh } from '@/lib/platformAdminFeedScopeRefresh';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { mapApiPostToFeedPost, mapApiPollToFeedPoll, prependUniqueFeedPost, normalizePostId } from '@/lib/postMappers';
import { useAppUser } from '@/hooks/useAppUser';
import { useLanguage } from '@/contexts/LanguageContext';
import { listPublicEvents } from '@/services/eventService';
import { mapPublicEventToCard } from '@/lib/eventUi';


import { SuggestedPartnersSection } from '@/components/partner/SuggestedPartnersSection';
import { PlatformAdCard } from '@/components/ads/PlatformAdCard';
import { feedAdSlotAfterPostIndex } from '@/lib/feedAdPlacement';
import { SidebarAdsCarousel } from '@/components/ads/SidebarAdsCarousel';
import { getActivePlatformAdvertisements } from '@/services/platformAdvertisementService';
import { isPublicAdRenderable } from '@/lib/adDisplay';
import { listPartners } from '@/services/partnerService';
import { sortPartnersPremiumFirst } from '@/lib/partnerSort';
import { FEED_EVENTS } from '@/lib/feedEvents';
import { engagementDetailHasMergeableFields, mergeFeedPostFromEngagementDetail } from '@/lib/postEngagementMerge';

function formatPostsCount(n) {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(n);
}

function formatChange(percentageChange) {
  if (percentageChange === 0) {
    return null; // Caller shows "Popular" instead of "+0%"
  }
  if (percentageChange > 0) {
    return `+${percentageChange}%`;
  }
  return `${percentageChange}%`;
}

/** Friendly display names – each tag has a distinct name so the same label never appears twice. */
const TRENDING_DISPLAY_NAMES = {
  trending_top: 'Office Market 2025',
  trending_mid: 'PropTech',
  trending_low: 'Sustainable Building',
  officemarket2025: 'Office Market',
  proptech: 'Prop Tech',
  sustainablebuilding: 'Sustainability',
  reinvesting: 'RE Investing',
  commercialre: 'Commercial RE',
  vdpconnect: 'vdpConnect',
  realestate: 'Real Estate',
  api: 'API',
  wertermittlung: 'Wertermittlung',
  testing: 'Testing',
  swagger: 'Swagger',
};

/** Returns a neat display name for the hashtag (e.g. "trending_top" → "Office Market 2025"). */
function getDisplayNameForTag(tag) {
  const raw = typeof tag === 'string' ? tag.trim().replace(/^#+/, '') : '';
  if (!raw) {
    return '';
  }
  const key = raw.toLowerCase().replace(/\s/g, '');
  const mapped = TRENDING_DISPLAY_NAMES[key];
  if (mapped) {
    return mapped;
  }
  return raw
    .split(/_|\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, isLoggedIn, loading: authLoading } = useAppUser();
  const { language } = useLanguage();
  const { country: adminScopeCountry } = useAdminScopeCountry();
  const [sidebarPartners, setSidebarPartners] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [sidebarPartnersLoading, setSidebarPartnersLoading] = useState(true);
  const currentUserAvatar = authUser?.avatarUrl ?? '';
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [feedSentinelRef, setFeedSentinelRef] = useState(null);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(false);
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [suggestedPeopleLoading, setSuggestedPeopleLoading] = useState(true);
  /** @type {[Array<object>, import('react').Dispatch<import('react').SetStateAction<Array<object>>>]} */
  const [platformFeedAds, setPlatformFeedAds] = useState(/** @type {Array<object>} */ ([]));
  /** @type {[Array<object>, import('react').Dispatch<import('react').SetStateAction<Array<object>>>]} */
  const [platformSidebarAds, setPlatformSidebarAds] = useState(/** @type {Array<object>} */ ([]));

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(true);

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!isLoggedIn) {
      setUpcomingEvents([]);
      setUpcomingEventsLoading(false);
      return;
    }
    const locale = language === 'DE' ? 'de-DE' : 'en-US';
    let cancelled = false;
    setUpcomingEventsLoading(true);
    listPublicEvents({ scope: 'upcoming', page: 1, pageSize: 5 })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const raw = res?.data ?? res?.Data ?? [];
        const lang = language === 'DE' ? 'DE' : 'EN';
        const items = (Array.isArray(raw) ? raw : []).map((row) => mapPublicEventToCard(row, { locale, language: lang }));
        setUpcomingEvents(items.slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) {
          setUpcomingEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setUpcomingEventsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, language, adminScopeCountry]);

  const loadPlatformAds = useCallback(() => {
    if (!isLoggedIn) {
      return;
    }
    const lang = language === 'DE' ? 'DE' : 'EN';
    getActivePlatformAdvertisements()
      .then(({ feedAds, sidebarAds }) => {
        const keep = (list) =>
          (Array.isArray(list) ? list : []).filter((ad) => isPublicAdRenderable(ad, lang));
        setPlatformFeedAds(keep(feedAds));
        setPlatformSidebarAds(keep(sidebarAds));
      })
      .catch(() => {
        setPlatformFeedAds([]);
        setPlatformSidebarAds([]);
      });
  }, [isLoggedIn, language]);

  const fetchFeed = useCallback((page = 1, append = false, silent = false) => {
    if (!isLoggedIn) {return;}
    if (!silent) {
      if (append) {
        setLoadMoreLoading(true);
      } else {
        setFeedLoading(true);
        setFeedPage(1);
      }
    }
    getFeed(page, PAGE_SIZE)
      .then((data) => {
        const raw = data?.data ?? data?.items ?? data;
        const items = Array.isArray(raw) ? raw : [];
        const mapped = items.map((p) => mapApiPostToFeedPost(p, { currentUserAvatar }));
        const total = Math.max(0, data?.totalPages ?? 0);
        setTotalPages(total);
        if (append) {
          setFeedPosts((prev) => {
            const existing = new Set(prev.map((p) => normalizePostId(p.id)));
            const newItems = mapped.filter((p) => !existing.has(normalizePostId(p.id)));
            return [...prev, ...newItems];
          });
          setFeedPage(page);
        } else {
          setFeedPosts(mapped);
        }
        setFeedError(null);
        // Refetch ads after first-page feed succeeds so slots update even if /Advertisements/active raced with auth/token on mount.
        if (!append) {
          loadPlatformAds();
        }
      })
      .catch((err) => {
        setFeedError(err.message);
        if (!append) {setFeedPosts([]);}
      })
      .finally(() => {
        if (!silent) {
          setFeedLoading(false);
          setLoadMoreLoading(false);
        }
      });
  }, [isLoggedIn, currentUserAvatar, loadPlatformAds]);

  const loadMore = useCallback(() => {
    if (!isLoggedIn || loadMoreLoading || feedLoading) {return;}
    const nextPage = feedPage + 1;
    if (nextPage > totalPages) {return;}
    fetchFeed(nextPage, true);
  }, [isLoggedIn, feedPage, totalPages, loadMoreLoading, feedLoading, fetchFeed]);

  // Update single post in place (likes, reposts, bookmarks, comments) — do not reorder rows.
  const mergePostEngagement = useCallback((postId, detail) => {
    if (!postId) {return;}
    if (engagementDetailHasMergeableFields(detail)) {
      const norm = (x) => String(x ?? '').toLowerCase();
      setFeedPosts((prev) => {
        const idx = prev.findIndex((p) => norm(p.id) === norm(postId));
        if (idx < 0) {return prev;}
        const merged = mergeFeedPostFromEngagementDetail(prev[idx], { ...detail, postId }, authUser?.userId);
        if (!merged) {return prev;}
        const next = [...prev];
        next[idx] = merged;
        return next;
      });
      // Don't refetch: engagement payload already contains authoritative counts/flags.
      return;
    }
    getPostById(postId)
      .then((apiPost) => {
        if (!apiPost) {return;}
        const mapped = mapApiPostToFeedPost(apiPost, { currentUserAvatar });
        const norm = (x) => String(x ?? '').toLowerCase();
        setFeedPosts((prev) => {
          const idx = prev.findIndex((p) => norm(p.id) === norm(postId));
          if (idx < 0) {return prev;}
          const next = [...prev];
          next[idx] = mapped;
          return next;
        });
      })
      .catch(() => {});
  }, [authUser?.userId, currentUserAvatar]);

  const handlePostCreated = useCallback((apiPost) => {
    const authUserAsAuthor = authUser ? { name: authUser.displayName, handle: authUser.handle, isVerified: authUser.isVerified } : { name: '', handle: '', isVerified: false };
    const post = (apiPost?.id ?? null) !== null || (apiPost?.Id ?? null) !== null
      ? mapApiPostToFeedPost(apiPost, { useCurrentUserAsAuthor: true, currentUserAvatar, currentUser: authUserAsAuthor })
      : {
        id: `new-${Date.now()}`,
        author: { name: authUserAsAuthor.name, handle: authUserAsAuthor.handle, avatar: currentUserAvatar || null, isVerified: authUserAsAuthor.isVerified },
        content: apiPost?.content ?? '',
        likes: 0,
        comments: 0,
        reposts: 0,
        views: 0,
        timestamp: 'Just now',
        createdAt: new Date().toISOString(),
        isLiked: false,
        isBookmarked: false,
        isReposted: false,
        postType: apiPost?.type ?? 'post',
      };
    setFeedPosts((prev) => prependUniqueFeedPost(prev, post));
  }, [authUser, currentUserAvatar]);

  useEffect(() => {
    const onEngagement = (e) => {
      if (e.detail?.refetchFeed) {
        fetchFeed(1, false, true);
        return;
      }
      const postId = e.detail?.postId;
      if (postId) {
        mergePostEngagement(postId, e.detail);
      }
    };
    const onFeedChange = () => fetchFeed(1, false, true);
    const onPostCreatedEvent = (e) => {
      if (e.detail?.post) {
        handlePostCreated(e.detail.post);
        return;
      }
      fetchFeed(1, false, true);
    };
    window.addEventListener(FEED_EVENTS.POST_CREATED, onPostCreatedEvent);
    window.addEventListener(FEED_EVENTS.POST_UPDATED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    return () => {
      window.removeEventListener(FEED_EVENTS.POST_CREATED, onPostCreatedEvent);
      window.removeEventListener(FEED_EVENTS.POST_UPDATED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    };
  }, [fetchFeed, mergePostEngagement, handlePostCreated]);

  // Fetch feed when logged in (manual, Google, Microsoft, LinkedIn)
  useEffect(() => {
    if (!isLoggedIn) {
      setFeedPosts([]);
      setFeedLoading(false);
      setFeedError(null);
      return;
    }
    fetchFeed();
  }, [isLoggedIn, fetchFeed, adminScopeCountry]);

  const refreshMarketScopedSidebar = useCallback(() => {
    if (!isLoggedIn) {
      return;
    }
    const locale = language === 'DE' ? 'de-DE' : 'en-US';
    const lang = language === 'DE' ? 'DE' : 'EN';
    setUpcomingEventsLoading(true);
    listPublicEvents({ scope: 'upcoming', page: 1, pageSize: 5 })
      .then((res) => {
        const raw = res?.data ?? res?.Data ?? [];
        const items = (Array.isArray(raw) ? raw : []).map((row) => mapPublicEventToCard(row, { locale, language: lang }));
        setUpcomingEvents(items.slice(0, 5));
      })
      .catch(() => setUpcomingEvents([]))
      .finally(() => setUpcomingEventsLoading(false));

    setTrendingLoading(true);
    setTrendingError(false);
    getTrendingHashtags(5, 7)
      .then((data) => {
        setTrendingTopics(
          (data || []).map((item) => {
            const tag = item.tag ?? item.Tag ?? '';
            const pct = item.percentageChange ?? item.PercentageChange;
            return {
              hashtagId: item.hashtagId ?? item.HashtagId,
              tag,
              displayTag: getDisplayNameForTag(tag),
              posts: formatPostsCount(item.postsCount ?? item.PostsCount ?? 0),
              percentageChange: pct,
              change: (pct !== null && pct !== undefined) ? formatChange(pct) : null,
            };
          }),
        );
      })
      .catch(() => {
        setTrendingError(true);
        setTrendingTopics([]);
      })
      .finally(() => setTrendingLoading(false));

    setSidebarPartnersLoading(true);
    listPartners(1, 5, { showLoader: false })
      .then((res) => {
        const raw = res?.data ?? res?.Data ?? res?.items ?? res?.Items ?? [];
        setSidebarPartners(sortPartnersPremiumFirst(Array.isArray(raw) ? raw : []));
      })
      .catch(() => setSidebarPartners([]))
      .finally(() => setSidebarPartnersLoading(false));

    setSuggestedPeopleLoading(true);
    getSuggestedPeople(5)
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setSuggestedPeople(items.map(mapSuggestedPersonToUserCard));
      })
      .catch(() => setSuggestedPeople([]))
      .finally(() => setSuggestedPeopleLoading(false));

    loadPlatformAds();
  }, [isLoggedIn, language, loadPlatformAds]);

  useEffect(() => {
    return subscribeAdminScopeFeedRefresh(() => {
      fetchFeed(1, false, true);
      refreshMarketScopedSidebar();
    });
  }, [fetchFeed, refreshMarketScopedSidebar]);

  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    const el = feedSentinelRef;
    if (!el || !isLoggedIn) {return;}
    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {return;}
        loadMore();
      },
      { rootMargin: '200px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isLoggedIn, feedSentinelRef, loadMore]);

  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    setTrendingError(false);
    getTrendingHashtags(5, 7)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setTrendingTopics(
          (data || []).map((item) => {
            const tag = item.tag ?? item.Tag ?? '';
            const pct = item.percentageChange ?? item.PercentageChange; // null from API = "Popular"
            return {
              hashtagId: item.hashtagId ?? item.HashtagId,
              tag,
              displayTag: getDisplayNameForTag(tag),
              posts: formatPostsCount(item.postsCount ?? item.PostsCount ?? 0),
              percentageChange: pct,
              change: (pct !== null && pct !== undefined) ? formatChange(pct) : null,
            };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setTrendingError(true);
          setTrendingTopics([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTrendingLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [adminScopeCountry]);

  useEffect(() => {
    let cancelled = false;
    setSidebarPartnersLoading(true);
    listPartners(1, 5, { showLoader: false })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const raw = res?.data ?? res?.Data ?? res?.items ?? res?.Items ?? [];
        setSidebarPartners(sortPartnersPremiumFirst(Array.isArray(raw) ? raw : []));
      })
      .catch(() => {
        if (!cancelled) {
          setSidebarPartners([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSidebarPartnersLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authUser?.userId, isLoggedIn, adminScopeCountry]);

  // Fetch suggested people when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setSuggestedPeople([]);
      setSuggestedPeopleLoading(false);
      return;
    }
    let cancelled = false;
    setSuggestedPeopleLoading(true);
    getSuggestedPeople(5)
      .then((data) => {
        if (cancelled) {return;}
        const items = Array.isArray(data) ? data : [];
        setSuggestedPeople(items.map(mapSuggestedPersonToUserCard));
      })
      .catch(() => { if (!cancelled) {setSuggestedPeople([]);} })
      .finally(() => { if (!cancelled) {setSuggestedPeopleLoading(false);} });
    return () => { cancelled = true; };
  }, [isLoggedIn, adminScopeCountry]);

  useEffect(() => {
    if (!isLoggedIn) {
      setPlatformFeedAds([]);
      setPlatformSidebarAds([]);
      return;
    }
    loadPlatformAds();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPlatformAds();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isLoggedIn, location.key, loadPlatformAds, adminScopeCountry]);

  const [editingPost, setEditingPost] = useState(null);

  const handlePostDeleted = (postId) => {
    const norm = (x) => String(x ?? '').toLowerCase();
    setFeedPosts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
  };

  const handlePollVoted = (postId, apiPoll) => {
    const mappedPoll = mapApiPollToFeedPoll(apiPoll);
    if (!mappedPoll) {return;}
    setFeedPosts((prev) =>
      prev.map((p) =>
        (p.id === postId || p.id === postId?.toString?.())
          ? { ...p, poll: mappedPoll }
          : p,
      ),
    );
  };

  const handlePostUpdated = (updatedApiPost) => {
    if (!updatedApiPost) {return;}
    const authUserAsAuthor = authUser ? { name: authUser.displayName, handle: authUser.handle, isVerified: authUser.isVerified } : { name: '', handle: '', isVerified: false };
    const mapped = mapApiPostToFeedPost(updatedApiPost, { useCurrentUserAsAuthor: true, currentUserAvatar, currentUser: authUserAsAuthor });
    setFeedPosts((prev) => prev.map((p) => (p.id === mapped.id ? mapped : p)));
    setEditingPost(null);
  };

  const displayedPosts = feedPosts;

  return (
    <MainLayout onPostCreated={handlePostCreated}>
      <EditPostModal
        open={Boolean(editingPost)}
        onOpenChange={(open) => !open && setEditingPost(null)}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Create Post - only when logged in (manual, Google, Microsoft, LinkedIn) */}
            {isLoggedIn && <CreatePost onPostCreated={handlePostCreated} />}
            
            {/* Posts from API */}
            <div className="space-y-4">
              {(feedLoading || (authLoading && isLoggedIn)) && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <FeedPostSkeleton key={i} />)}
                </div>
              )}
              {!feedLoading && !authLoading && !isLoggedIn && (
                <div className="text-center py-8 text-muted-foreground">
                  <LangText path="common.log_in_to_see_posts_from_your_feed"  />
                </div>
              )}
              {!feedLoading && isLoggedIn && feedError && (
                <div className="text-center py-8 text-muted-foreground">
                  {feedError}
                </div>
              )}
              {!feedLoading && isLoggedIn && !feedError && displayedPosts.length === 0 && (
                <div className="space-y-4">
                  {/* No organic posts yet: show feed ad in the second slot below the composer (same slot as “after first post” when feed loads). */}
                  {platformFeedAds[0] ? (
                    <div className="animate-fade-in">
                      <PlatformAdCard ad={platformFeedAds[0]} variant="feed" />
                    </div>
                  ) : null}
                  <div className="text-center py-8 text-muted-foreground">
                    <LangText path="common.no_posts_yet_create_your_first_post_above"  />
                  </div>
                </div>
              )}
              {/*
                Feed ads: first slot after the premium-partner block, then after every 2 posts.
              */}
              {!feedLoading && displayedPosts.length > 0 && displayedPosts.map((post, index) => {
                const feedAdSlot = feedAdSlotAfterPostIndex(index, displayedPosts);
                const feedAd = feedAdSlot >= 0 ? platformFeedAds[feedAdSlot] : null;
                return (
                  <Fragment key={String(post.id ?? `post-${index}`)}>
                    <div
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="animate-fade-in"
                    >
                      <PostCard post={post} onEdit={setEditingPost} onDeleted={handlePostDeleted} onPollVoted={handlePollVoted} />
                    </div>
                    {feedAd ? (
                      <div className="animate-fade-in">
                        <PlatformAdCard ad={feedAd} variant="feed" />
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </div>

            {/* Infinite scroll sentinel + loading indicator */}
            {displayedPosts.length > 0 && (
              <div ref={setFeedSentinelRef} className="min-h-[1px] py-4 flex justify-center items-center">
                {loadMoreLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span><LangText path="common.loading_more"  /></span>
                  </div>
                )}
                {!loadMoreLoading && feedPage >= totalPages && displayedPosts.length > 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    <LangText path="feed.allCaughtUp"  />
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Trending Topics */}
            <div className="bg-card rounded-xl border border-border p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    <LangText path="explore.trendingTopics"  />
                  </h2>
                </div>
              </div>
              <div className="space-y-1">
                {trendingLoading && (
                  <p className="text-sm text-muted-foreground py-2">
                    <LangText path="common.loading"  />
                  </p>
                )}
                {!trendingLoading && (trendingError || trendingTopics.length === 0) && (
                  <p className="text-sm text-muted-foreground py-2">
                    <LangText path="explore.no_trending_topics_right_now"  />
                  </p>
                )}
                {!trendingLoading && trendingTopics.length > 0 && trendingTopics.map((topic, index) => (
                  <Link 
                    key={topic.hashtagId || topic.tag} 
                    to={`/explore/tag/${encodeURIComponent((topic.tag || '').replace(/^#/, ''))}`}
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-2 rounded-lg transition-colors group"
                  >
                    <span className="text-sm font-medium text-muted-foreground w-5">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">#{topic.displayTag || getDisplayNameForTag(topic.tag) || topic.tag}</p>
                      <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                    </div>
                    {(topic.percentageChange !== null && topic.percentageChange !== undefined && topic.percentageChange !== 0) ? (
                      <Badge variant="secondary" className="text-xs text-success">
                        {topic.change}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </div>
              <button 
                className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
                onClick={() => navigate('/explore')}
                type="button"
              >
                <LangText path="feed.viewMore"  /> <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested People */}
            <div className="bg-card rounded-xl border border-border p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    <LangText path="feed.peopleYouMayKnow"  />
                  </h2>
                </div>
              </div>
              <div className="space-y-1">
                {suggestedPeopleLoading && (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((i) => <UserCardSkeleton key={i} />)}
                  </div>
                )}
                {!suggestedPeopleLoading && suggestedPeople.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    <LangText path="common.no_suggestions_right_now"  />
                  </p>
                )}
                {!suggestedPeopleLoading && suggestedPeople.length > 0 && suggestedPeople.map((user) => (
                  <UserCard key={user.id} user={user} variant="compact" onFollowChange={(userId, isFollowing) => {
                    setSuggestedPeople((prev) => prev.map((u) => u.userId === userId ? { ...u, isFollowing } : u));
                  }} />
                ))}
              </div>
              <button 
                className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
                onClick={() => navigate('/people')}
              >
                <LangText path="feed.viewAll"  /> <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <SuggestedPartnersSection
              partners={sidebarPartners}
              loading={sidebarPartnersLoading}
              onMembershipChange={(orgId) => {
                const norm = (x) => String(x ?? '').toLowerCase();
                const id = norm(orgId);
                setSidebarPartners((prev) =>
                  prev.map((p) => (norm(p.id ?? p.Id) === id ? { ...p, isMember: true, IsMember: true } : p)),
                );
              }}
            />

            {/* Upcoming Events */}
            <div className="bg-card rounded-xl border border-border p-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    <LangText path="adminDashboard.upcomingEvents"  />
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {upcomingEventsLoading ? (
                  <p className="text-sm text-muted-foreground py-2">
                    <LangText path="common.loading"  />
                  </p>
                ) : upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    <LangText path="common.no_upcoming_events_yet"  />
                  </p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.scheduleConfirmed ? (
                              event.date
                            ) : (
                              <LangText path="events.registrationComingSoon"  />
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={event.isVirtual ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {event.isVirtual ? (
                                <LangText path="events.online"  />
                              ) : (
                                <LangText path="common.in_person"  />
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
                onClick={() => navigate('/events')}
              >
                <LangText path="common.view_all_events"  /> <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {platformSidebarAds.length > 0 ? (
              <div className="animate-fade-in mx-auto w-full lg:mx-0" style={{ animationDelay: '140ms' }}>
                <SidebarAdsCarousel ads={platformSidebarAds} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
