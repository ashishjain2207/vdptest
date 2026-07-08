import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { profilePath, partnerPath } from '@/lib/appRoutes';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/post/PostCard';
import { EditPostModal } from '@/components/post/EditPostModal';
import { UserCard } from '@/components/user/UserCard';
import { OrgCard } from '@/components/organization/OrgCard';
import {
  Clock,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from '@imriva/framework';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';
import { getTrendingHashtags } from '@/services/trendingService';
import { getPostsByHashtag, getTrendingPosts, getPostById, searchPosts } from '@/services/postService';
import { getSuggestedPeople, searchUsers } from '@/services/suggestedPeopleService';
import { mapSuggestedPersonToUserCard } from '@/lib/userMappers';
import { mapApiPostToFeedPost } from '@/lib/postMappers';
import {
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  formatSavedSearchTimestamp,
} from '@/services/savedSearchService';
import { FEED_EVENTS } from '@/lib/feedEvents';
import { useStaffScopeContentRefresh } from '@/lib/platformAdminFeedScopeRefresh';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { engagementDetailHasMergeableFields, mergeFeedPostFromEngagementDetail } from '@/lib/postEngagementMerge';
import { useAuth } from '@/contexts/AuthContext';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { listPartners } from '@/services/partnerService';
import { sortPartnersPremiumFirst } from '@/lib/partnerSort';
import { filterPartnersByQuery, mapPartnerToExploreOrg } from '@/lib/partnerMappers';
import { isDummyPartner } from '@/lib/displayLabels';

const Explore = () => {
  const navigate = useNavigate();
  const { tagName: tagFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const tagFromQuery = searchParams.get('tag')?.trim() || null;
  const tagFromUrl = tagFromPath?.trim() || tagFromQuery || null;
  const { language } = useLanguage();
  const label = (key) => t(language, `explore.${key}`);
  const { user: authUser } = useAuth();
  const { country: adminScopeCountry } = useAdminScopeCountry();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [hashtagPosts, setHashtagPosts] = useState([]);
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [, setHashtagTotalCount] = useState(0);
  const [savedSearches, setSavedSearches] = useState([]);
  const [savedSearchesLoading, setSavedSearchesLoading] = useState(true);
  const [saveSearchLoading, setSaveSearchLoading] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingPostsLoading, setTrendingPostsLoading] = useState(false);
  const [keywordSearchPosts, setKeywordSearchPosts] = useState([]);
  const [keywordSearchUsers, setKeywordSearchUsers] = useState([]);
  const [keywordSearchLoading, setKeywordSearchLoading] = useState(false);
  const [featuredPeople, setFeaturedPeople] = useState([]);
  const [featuredPeopleLoading, setFeaturedPeopleLoading] = useState(false);
  const [explorePartners, setExplorePartners] = useState([]);
  const [explorePartnersLoading, setExplorePartnersLoading] = useState(true);
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0);

  const bumpMarketScopedContent = useCallback(() => {
    setFeedRefreshTrigger((prev) => prev + 1);
  }, []);

  useStaffScopeContentRefresh(bumpMarketScopedContent);
  const [editingPost, setEditingPost] = useState(null);
  const hashtagLoadedForTagRef = useRef(null);
  const keywordSearchDebounceRef = useRef(null);
  const keywordSearchCancelledRef = useRef(false);

  const handlePostDeleted = (postId) => {
    const norm = (x) => String(x ?? '').toLowerCase();
    setHashtagPosts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
    setTrendingPosts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
    setKeywordSearchPosts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
  };

  const handlePostUpdated = (updatedApiPost) => {
    if (!updatedApiPost) { return; }
    const authUserAsAuthor = authUser ? { name: authUser.displayName, handle: authUser.handle, isVerified: authUser.isVerified } : { name: '', handle: '', isVerified: false };
    const mapped = mapApiPostToFeedPost(updatedApiPost, { useCurrentUserAsAuthor: true, currentUserAvatar: authUser?.avatarUrl ?? '', currentUser: authUserAsAuthor });
    const norm = (x) => String(x ?? '').toLowerCase();
    setHashtagPosts((prev) => prev.map((p) => (norm(p.id) === norm(mapped.id) ? mapped : p)));
    setTrendingPosts((prev) => prev.map((p) => (norm(p.id) === norm(mapped.id) ? mapped : p)));
    setKeywordSearchPosts((prev) => prev.map((p) => (norm(p.id) === norm(mapped.id) ? mapped : p)));
    setEditingPost(null);
  };

  // Sync searchQuery from URL: tag (hashtag) or q (keyword search from header)
  useEffect(() => {
    if (tagFromUrl) {
      const display = tagFromUrl.charAt(0).toUpperCase() + tagFromUrl.slice(1);
      setSearchQuery(`#${display}`);
      return;
    }
    const qFromUrl = searchParams.get('q')?.trim() || '';
    if (qFromUrl) {
      setSearchQuery(qFromUrl);
    }
  }, [tagFromUrl, searchParams]);

  const mergePostEngagement = useCallback((postId, detail) => {
    if (!postId) {return;}
    if (engagementDetailHasMergeableFields(detail)) {
      const norm = (x) => String(x ?? '').toLowerCase();
      const samplePost =
        hashtagPosts.find((p) => norm(p.id) === norm(postId)) ??
        trendingPosts.find((p) => norm(p.id) === norm(postId)) ??
        keywordSearchPosts.find((p) => norm(p.id) === norm(postId));
      const preview = samplePost
        ? mergeFeedPostFromEngagementDetail(samplePost, { ...detail, postId }, authUser?.userId)
        : null;
      if (preview) {
        const patchList = (setter) => {
          setter((prev) =>
            prev.map((p) => {
              if (norm(p.id) !== norm(postId)) {return p;}
              const merged = mergeFeedPostFromEngagementDetail(p, { ...detail, postId }, authUser?.userId);
              return merged ?? p;
            }),
          );
        };
        patchList(setHashtagPosts);
        patchList(setTrendingPosts);
        patchList(setKeywordSearchPosts);
        return;
      }
    }
    getPostById(postId)
      .then((apiPost) => {
        if (!apiPost) {return;}
        const mapped = mapApiPostToFeedPost(apiPost);
        const norm = (x) => String(x ?? '').toLowerCase();
        const updateInPlace = (prev) => prev.map((p) => (norm(p.id) === norm(postId) ? mapped : p));
        setHashtagPosts(updateInPlace);
        setTrendingPosts(updateInPlace);
        setKeywordSearchPosts(updateInPlace);
      })
      .catch(() => {});
  }, [authUser?.userId, hashtagPosts, trendingPosts, keywordSearchPosts]);

  useEffect(() => {
    const onEngagement = (e) => {
      if (e.detail?.refetchFeed) {
        setFeedRefreshTrigger((prev) => prev + 1);
        return;
      }
      const postId = e.detail?.postId;
      if (postId) { mergePostEngagement(postId, e.detail); }
    };
    const onFeedChange = () => setFeedRefreshTrigger((prev) => prev + 1);
    window.addEventListener(FEED_EVENTS.POST_CREATED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_UPDATED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    return () => {
      window.removeEventListener(FEED_EVENTS.POST_CREATED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_UPDATED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagement);
    };
  }, [mergePostEngagement]);

  // Fetch posts by hashtag when tag is in URL
  useEffect(() => {
    if (!tagFromUrl) {
      setHashtagPosts([]);
      setHashtagTotalCount(0);
      hashtagLoadedForTagRef.current = null;
      return;
    }
    let cancelled = false;
    const isInitialLoad = hashtagLoadedForTagRef.current !== tagFromUrl;
    if (isInitialLoad) { setHashtagLoading(true); }
    getPostsByHashtag(tagFromUrl, 1, 20, { showLoader: false })
      .then((res) => {
        if (cancelled) {return;}
        const raw = res?.data ?? [];
        const mapped = raw.map((p) => mapApiPostToFeedPost(p));
        setHashtagPosts(mapped);
        setHashtagTotalCount(res?.totalCount ?? 0);
        hashtagLoadedForTagRef.current = tagFromUrl;
      })
      .catch(() => {
        if (!cancelled) {
          setHashtagPosts([]);
          setHashtagTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) {setHashtagLoading(false);}
      });
    return () => { cancelled = true; };
  }, [tagFromUrl, feedRefreshTrigger]);

  // Keyword search: when there is a search query and no hashtag from URL, search posts by content + users by name
  useEffect(() => {
    keywordSearchCancelledRef.current = false;
    if (tagFromUrl) {
      setKeywordSearchPosts([]);
      setKeywordSearchUsers([]);
      if (keywordSearchDebounceRef.current) {
        clearTimeout(keywordSearchDebounceRef.current);
        keywordSearchDebounceRef.current = null;
      }
      return;
    }
    const q = searchQuery.trim();
    if (!q) {
      setKeywordSearchPosts([]);
      setKeywordSearchUsers([]);
      return;
    }
    if (keywordSearchDebounceRef.current) {
      clearTimeout(keywordSearchDebounceRef.current);
    }
    keywordSearchDebounceRef.current = setTimeout(() => {
      keywordSearchDebounceRef.current = null;
      setKeywordSearchLoading(true);
      Promise.all([
        searchPosts(q, 1, 20, { showLoader: false }),
        searchUsers(q, 1, 20),
      ])
        .then(([postsRes, usersRes]) => {
          if (keywordSearchCancelledRef.current) { return; }
          const rawPosts = postsRes?.data ?? [];
          setKeywordSearchPosts(rawPosts.map((p) => mapApiPostToFeedPost(p)));
          const rawUsers = usersRes?.data ?? [];
          setKeywordSearchUsers(rawUsers.map(mapSuggestedPersonToUserCard));
        })
        .catch(() => {
          if (!keywordSearchCancelledRef.current) {
            setKeywordSearchPosts([]);
            setKeywordSearchUsers([]);
          }
        })
        .finally(() => {
          if (!keywordSearchCancelledRef.current) { setKeywordSearchLoading(false); }
        });
    }, 400);
    return () => {
      keywordSearchCancelledRef.current = true;
      if (keywordSearchDebounceRef.current) {
        clearTimeout(keywordSearchDebounceRef.current);
        keywordSearchDebounceRef.current = null;
      }
    };
  }, [searchQuery, tagFromUrl, adminScopeCountry]);

  // Fetch saved searches on mount
  useEffect(() => {
    let cancelled = false;
    setSavedSearchesLoading(true);
    getSavedSearches(20)
      .then((data) => {
        if (cancelled) {return;}
        setSavedSearches(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {setSavedSearches([]);}
      })
      .finally(() => {
        if (!cancelled) {setSavedSearchesLoading(false);}
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    getTrendingHashtags(10, 7)
      .then((data) => {
        if (cancelled) {return;}
        const items = (data || []).map((item) => {
          const tag = item.tag ?? item.Tag ?? '';
          const display = tag ? `#${tag.charAt(0).toUpperCase() + tag.slice(1)}` : '';
          return { tag: display || tag, postsCount: item.postsCount ?? item.PostsCount ?? 0, percentageChange: item.percentageChange ?? item.PercentageChange ?? 0 };
        });
        setTrendingSearches(items);
      })
      .catch(() => {
        if (!cancelled) {setTrendingSearches([]);}
      })
      .finally(() => {
        if (!cancelled) {setTrendingLoading(false);}
      });
    return () => { cancelled = true; };
  }, [adminScopeCountry]);

  const hasSearchQuery = searchQuery.trim().length > 0;

  const normalizeQueryForCompare = (q) => (q || '').trim().toLowerCase().replace(/^#/, '');
  const isCurrentSearchSaved = hasSearchQuery && savedSearches.some(
    (s) => normalizeQueryForCompare(s.query ?? s.Query) === normalizeQueryForCompare(searchQuery),
  );
  // Fetch trending posts and suggested people for default Explore view (API data only)
  useEffect(() => {
    if (hasSearchQuery || tagFromUrl) {return;}
    let cancelled = false;
    setTrendingPostsLoading(true);
    setFeaturedPeopleLoading(true);
    getTrendingPosts(1, 6, { showLoader: false })
      .then((res) => {
        if (cancelled) {return;}
        const raw = res?.data ?? res?.Data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        setTrendingPosts(list.map((p) => mapApiPostToFeedPost(p)));
      })
      .catch(() => { if (!cancelled) {setTrendingPosts([]);} })
      .finally(() => { if (!cancelled) {setTrendingPostsLoading(false);} });
    getSuggestedPeople(4)
      .then((items) => {
        if (cancelled) {return;}
        const raw = Array.isArray(items) ? items : [];
        setFeaturedPeople(raw.map(mapSuggestedPersonToUserCard));
      })
      .catch(() => { if (!cancelled) {setFeaturedPeople([]);} })
      .finally(() => { if (!cancelled) {setFeaturedPeopleLoading(false);} });
    return () => { cancelled = true; };
  }, [hasSearchQuery, tagFromUrl, feedRefreshTrigger, adminScopeCountry]);

  useEffect(() => {
    let cancelled = false;
    setExplorePartnersLoading(true);
    listPartners(1, 100, { showLoader: false })
      .then((res) => {
        if (cancelled) { return; }
        const raw = res?.data ?? res?.Data ?? res?.items ?? res?.Items ?? [];
        const list = (Array.isArray(raw) ? raw : []).filter((p) => !isDummyPartner(p));
        setExplorePartners(sortPartnersPremiumFirst(list));
      })
      .catch(() => {
        if (!cancelled) { setExplorePartners([]); }
      })
      .finally(() => {
        if (!cancelled) { setExplorePartnersLoading(false); }
      });
    return () => { cancelled = true; };
  }, [adminScopeCountry]);

  const topOrganizations = useMemo(
    () => explorePartners.slice(0, 3).map(mapPartnerToExploreOrg),
    [explorePartners],
  );

  const hasHashtagFromUrl = Boolean(tagFromUrl);
  const posts = hasHashtagFromUrl ? hashtagPosts : keywordSearchPosts;
  const users = hasHashtagFromUrl ? [] : keywordSearchUsers;
  const organizations = useMemo(() => {
    if (!hasSearchQuery || hasHashtagFromUrl) {
      return [];
    }
    return filterPartnersByQuery(explorePartners, searchQuery).map(mapPartnerToExploreOrg);
  }, [hasSearchQuery, hasHashtagFromUrl, explorePartners, searchQuery]);
  const searchResultsLoading = hasHashtagFromUrl ? hashtagLoading : keywordSearchLoading;

  const handleTagClick = (tag) => {
    const normalized = (tag || '').trim().replace(/^#/, '');
    if (!normalized) {
      navigate('/explore');
      return;
    }
    if (tagFromUrl?.toLowerCase() === normalized.toLowerCase()) {
      navigate('/explore');
    } else {
      navigate(`/explore/tag/${encodeURIComponent(normalized)}`);
    }
  };

  const handleSavedSearchClick = (query) => {
    const trimmed = (query || '').trim();
    setSearchQuery(trimmed);
    const tagMatch = trimmed.match(/^#(\S+)$/);
    if (tagMatch) {
      navigate(`/explore/tag/${encodeURIComponent(tagMatch[1])}`);
    } else if (trimmed) {
      navigate(`/explore?q=${encodeURIComponent(trimmed)}`, { replace: true });
    }
  };

  const findSavedSearchIdForCurrentQuery = () => {
    if (!hasSearchQuery) {return null;}
    const entry = savedSearches.find(
      (s) => normalizeQueryForCompare(s.query ?? s.Query) === normalizeQueryForCompare(searchQuery),
    );
    const id = entry?.id ?? entry?.Id;
    return id ?? null;
  };

  /** Save or remove the current query from saved searches (explicit action — Enter does not auto-save). */
  const handleToggleSavedSearch = async () => {
    const q = searchQuery?.trim();
    if (!q || saveSearchLoading) {return;}
    setSaveSearchLoading(true);
    try {
      if (isCurrentSearchSaved) {
        const id = findSavedSearchIdForCurrentQuery();
        if (!id) {
          toast.error(t('explore.could_not_find_saved_search_to_remove'));
          return;
        }
        const ok = await deleteSavedSearch(id);
        if (ok) {
          setSavedSearches((prev) => prev.filter((s) => (s.id ?? s.Id) !== id));
          toast.success(t('explore.removed_from_saved_searches'));
        } else {
          toast.error(t('explore.failed_to_remove_saved_search'));
        }
      } else {
        await saveSearch(q);
        const data = await getSavedSearches(20);
        setSavedSearches(Array.isArray(data) ? data : []);
        toast.success(t('explore.search_saved'));
      }
    } catch {
      toast.error(t('explore.could_not_update_saved_searches'));
    } finally {
      setSaveSearchLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') {return;}
    const q = searchQuery?.trim();
    if (!q) {return;}
    const tagMatch = q.match(/^#(\S+)$/);
    if (tagMatch) {
      navigate(`/explore/tag/${encodeURIComponent(tagMatch[1].toLowerCase())}`);
    } else {
      // Keyword search: only update URL — saving is via "Save Search" / toggle, not Enter
      navigate(`/explore?q=${encodeURIComponent(q)}`, { replace: true });
    }
  };

  const handleDeleteSavedSearch = async (e, id) => {
    e.stopPropagation();
    const ok = await deleteSavedSearch(id);
    if (ok) {
      setSavedSearches((prev) => prev.filter((s) => (s.id ?? s.Id) !== id));
      toast.success(t('explore.search_removed'));
    } else {
      toast.error(t('explore.failed_to_remove_search'));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/explore', { replace: true });
    setFeedRefreshTrigger((prev) => prev + 1);
  };

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
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            {label('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {label('subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div
            className={cn(
              'relative transition-all duration-200',
              isSearchFocused && 'transform scale-[1.01]',
            )}
          >
            <ClearableSearchInput
              aria-label={label('searchAriaLabel')}
              placeholder={label('searchPlaceholder')}
              searchIconClassName="left-4 w-5 h-5"
              inputClassName={cn(
                'pl-12 h-14 text-base bg-card border-2 transition-all',
                hasSearchQuery && 'pr-12',
                isSearchFocused ? 'border-primary shadow-soft' : 'border-border',
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onClear={clearSearch}
              clearAriaLabel={t('explore.clear_explore_search')}
              dataTestId="explore-search"
            />
          </div>
        </div>

        {/* Trending Hashtag Chips - API data only */}
        {trendingSearches.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {trendingSearches.map((item, index) => {
              const tagDisplay = typeof item === 'string' ? item : item.tag;
              const tagForUrl = (tagDisplay || '').replace(/^#/, '').trim();
              const isActive = tagFromUrl?.toLowerCase() === tagForUrl.toLowerCase();
              return (
                <button
                  key={index}
                  onClick={() => handleTagClick(tagForUrl)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/80 text-foreground hover:bg-accent border border-border hover:border-primary/30',
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  #{tagForUrl || tagDisplay}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area - show hashtag results immediately when tag in URL (no delay for searchQuery sync) */}
        {(hasSearchQuery || tagFromUrl) ? (
          /* Search Results */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {tagFromUrl ? (
                  `${label('postsWithHashtagPrefix')}${tagFromUrl.charAt(0).toUpperCase() + tagFromUrl.slice(1)}`
                ) : (
                  `${label('resultsFor')} "${searchQuery}"`
                )}
              </h2>
              <Button
                variant={isCurrentSearchSaved ? 'default' : 'outline'}
                size="sm"
                disabled={saveSearchLoading}
                className={cn(
                  'gap-2 transition-colors',
                  isCurrentSearchSaved && 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
                onClick={handleToggleSavedSearch}
              >
                {saveSearchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrentSearchSaved ? (
                  <BookmarkCheck className="w-4 h-4 fill-current" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                <LangText
                  path={
                    saveSearchLoading
                      ? (isCurrentSearchSaved ? 'explore.removing_search' : 'explore.saving_search')
                      : (isCurrentSearchSaved ? 'explore.remove_from_saved' : 'explore.save_search')
                  }
                />
              </Button>
            </div>

            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-secondary/50 mb-6">
                <TabsTrigger value="posts" className="gap-2 data-[state=active]:shadow-sm">
                  <LangText path="layout.posts"  />
                  <Badge variant="secondary" className="ml-1 text-xs">{posts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="people" className="gap-2 data-[state=active]:shadow-sm">
                  <LangText path="nav.people"  />
                  <Badge variant="secondary" className="ml-1 text-xs">{users.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="orgs" className="gap-2 data-[state=active]:shadow-sm">
                  <LangText path="explore.orgs"  />
                  <Badge variant="secondary" className="ml-1 text-xs">{organizations.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-4 mt-0" aria-label="Explore posts results">
                {searchResultsLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="explore.loading_posts"  /></span>
                  </div>
                )}
                {!searchResultsLoading && posts.length === 0 && hasHashtagFromUrl && (
                  <p className="text-sm text-muted-foreground py-8">
                    <LangText path="explore.no_posts_with_this_hashtag_yet"  />
                  </p>
                )}
                {!searchResultsLoading && posts.length === 0 && !hasHashtagFromUrl && hasSearchQuery && (
                  <p className="text-sm text-muted-foreground py-8">
                    <LangText path="explore.no_posts_or_people_found_for_this_search"  />
                  </p>
                )}
                {!searchResultsLoading && posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostCard post={post} onEdit={setEditingPost} onDeleted={handlePostDeleted} onPollVoted={(postId) => mergePostEngagement(postId)} hidePartnerTierBadge />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="people" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((user, index) => (
                    <div 
                      key={user.id}
                      className="animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => navigate(`/profile/${user.profileSlug ?? user.handle}`)}
                    >
                      <UserCard user={user} />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="orgs" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {explorePartnersLoading && (
                    <p className="text-sm text-muted-foreground col-span-full flex items-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <LangText path="explore.loading_organizations"  />
                    </p>
                  )}
                  {!explorePartnersLoading && organizations.length === 0 && hasSearchQuery && (
                    <p className="text-sm text-muted-foreground col-span-full py-4">
                      <LangText path="explore.no_organizations_found_for_this_search"  />
                    </p>
                  )}
                  {organizations.map((org, index) => (
                    <div 
                      key={org.id}
                      className="animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => navigate(partnerPath(org.handle))}
                    >
                      <OrgCard org={org} />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Default Explore View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Trending Now - from API (hashtags from posts) */}
              <div className="bg-card rounded-xl border border-border p-5 animate-fade-in min-h-[140px]" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    <LangText path="explore.trendingTopics"  />
                  </h2>
                </div>
                {trendingLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="explore.loading_trending"  /></span>
                  </div>
                )}
                {!trendingLoading && trendingSearches.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">
                    <LangText path="explore.no_trending_topics_right_now"  />
                  </p>
                )}
                {!trendingLoading && trendingSearches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((item, index) => {
                      const tagDisplay = typeof item === 'string' ? item : item.tag;
                      const tagForUrl = (tagDisplay || '').replace(/^#/, '').trim();
                      const href = tagForUrl ? `/explore/tag/${encodeURIComponent(tagForUrl)}` : '/explore';
                      return (
                        <Link
                          key={index}
                          to={href}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border hover:border-primary/50 hover:bg-accent rounded-full text-sm text-foreground transition-colors"
                        >
                          <TrendingUp className="w-3 h-3 text-primary" />
                          {typeof item === 'string' ? item : (item.tag ?? item.Tag ?? '')}
                          {(item.percentageChange !== null && item.percentageChange !== undefined && item.percentageChange !== 0) ? (
                            <span className={item.percentageChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.percentageChange > 0 ? '+' : ''}{item.percentageChange}%
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="animate-fade-in space-y-4" style={{ animationDelay: '200ms' }} aria-label="Trending posts list">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    <LangText path="explore.trendingPosts"  />
                  </h2>
                </div>
                {trendingPostsLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground py-6">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="explore.loading_posts_2"  /></span>
                  </div>
                )}
                {!trendingPostsLoading && trendingPosts.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">
                    <LangText path="explore.no_trending_posts_right_now_select_a_hashtag_above_or_search"  />
                  </p>
                )}
                {!trendingPostsLoading &&
                  trendingPosts.map((post, index) => (
                    <div key={String(post.id)} className="animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
                      <PostCard
                        post={post}
                        onEdit={setEditingPost}
                        onDeleted={handlePostDeleted}
                        onPollVoted={(postId) => mergePostEngagement(postId)}
                        hidePartnerTierBadge
                      />
                    </div>
                  ))}
              </div>

              {/* Featured People - from API (suggested people) */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-5 animate-fade-in" style={{ animationDelay: '350ms' }}>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="font-semibold text-foreground text-base sm:text-lg">
                    <LangText path="explore.featured_people"  />
                  </h2>
                  <Button variant="ghost" size="sm" className="text-primary gap-1 flex-shrink-0" onClick={() => navigate('/people')}>
                    <LangText path="feed.viewAll"  /> <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                {featuredPeopleLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground py-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="layout.loading"  /></span>
                  </div>
                )}
                {!featuredPeopleLoading && featuredPeople.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8">
                    <LangText path="explore.no_suggested_people_yet"  />
                  </p>
                )}
                {!featuredPeopleLoading && featuredPeople.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-3 sm:gap-4 lg:gap-5">
                    {featuredPeople.slice(0, 4).map((user, index) => (
                      <div 
                        key={user.userId ?? user.id}
                        className="animate-fade-in h-full cursor-pointer"
                        style={{ animationDelay: `${400 + (index * 50)}ms` }}
                        onClick={() => navigate(profilePath(user.profileSlug ?? user.handle ?? user.userId))}
                      >
                        <UserCard user={user} className="h-full" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 min-w-0 flex flex-col">
              {/* Saved Searches */}
              <div className="bg-card rounded-xl border border-border p-4 animate-fade-in min-h-[140px]" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Bookmark className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    <LangText path="explore.savedSearches"  />
                  </h2>
                </div>
                {savedSearchesLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="layout.loading"  /></span>
                  </div>
                ) : savedSearches.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    <LangText path="explore.savedSearchesEmpty"  />
                  </p>
                ) : (
                  <div className="space-y-1">
                    {savedSearches.map((search) => {
                      const id = search.id ?? search.Id;
                      const query = search.query ?? search.Query ?? '';
                      const createdAt = search.createdAt ?? search.CreatedAt;
                      return (
                        <div
                          key={id}
                          className="w-full flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors group"
                        >
                          <button
                            onClick={() => handleSavedSearchClick(query)}
                            className="flex-1 flex items-start gap-3 text-left min-w-0"
                          >
                            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {query}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatSavedSearchTimestamp(createdAt, language)}</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedSearch(e, id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            aria-label={t('explore.delete_saved_search')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Trending Topics - API data only */}
              <div className="bg-card rounded-xl border border-border p-4 animate-fade-in min-h-[180px]" style={{ animationDelay: '200ms' }}>
                <h2 className="font-semibold text-foreground mb-4">
                  <LangText path="explore.trendingTopics"  />
                </h2>
                {trendingLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="layout.loading"  /></span>
                  </div>
                ) : trendingSearches.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    <LangText path="explore.no_trending_topics_yet"  />
                  </p>
                ) : (
                  <div className="space-y-1">
                    {trendingSearches.map((item, index) => {
                      const tagDisplay = typeof item === 'string' ? item : item.tag;
                      const tagForUrl = (tagDisplay || '').replace(/^#/, '').trim();
                      const href = tagForUrl ? `/explore/tag/${encodeURIComponent(tagForUrl)}` : '/explore';
                      return (
                        <Link
                          key={index}
                          to={href}
                          className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                        >
                          <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            #{tagForUrl || tagDisplay}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Organizations */}
              <div className="bg-card rounded-xl border border-border p-4 animate-fade-in min-h-[140px]" style={{ animationDelay: '250ms' }}>
                <h2 className="font-semibold text-foreground mb-4">
                  <LangText path="explore.top_organizations"  />
                </h2>
                <div className="space-y-3">
                  {explorePartnersLoading && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <LangText path="layout.loading"  />
                    </p>
                  )}
                  {!explorePartnersLoading && topOrganizations.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      <LangText path="explore.no_organizations_to_show_yet"  />
                    </p>
                  )}
                  {!explorePartnersLoading && topOrganizations.map((org, index) => (
                    <div
                      key={org.id || org.handle || index}
                      role="button"
                      tabIndex={0}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => navigate(partnerPath(org.handle))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(partnerPath(org.handle));
                        }
                      }}
                    >
                      <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}</span>
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                          {org.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {org.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(org.membersCount ?? 0).toLocaleString()}{' '}
                          <LangText path="partners.membersLower"  />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Explore;
