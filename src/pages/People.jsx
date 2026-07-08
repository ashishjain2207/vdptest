import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
} from '@imriva/framework';
import { MapPin, Building, BadgeCheck, Loader2 } from 'lucide-react';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { cn } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';
import { jobTitleLabel } from '@/lib/displayLabels';
import { searchUsers, followUser, unfollowUser } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';

const PAGE_SIZE = 20;

function PersonCard({ user, language, onFollowChange, loading, onClick }) {
  const label = (key) => t(language, `people.${key}`);
  const roleLabel = user.role ? jobTitleLabel(user.role, language) : '';

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (loading) {return;}
    onFollowChange?.(user.userId, null, true); // set loading
    await (user.isFollowing ? unfollowUser(user.userId) : followUser(user.userId));
    onFollowChange?.(user.userId, !user.isFollowing, false); // update state, clear loading
  };

  return (
    <div
      className="h-full flex flex-col bg-card rounded-xl border border-border p-5 hover:shadow-card transition-all duration-200 cursor-pointer animate-fade-in group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4 flex-1 min-h-0">
        <Avatar className="w-14 h-14 flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {user.name}
                </h3>
                {user.isVerified && (
                  <BadgeCheck className="w-4 h-4 flex-shrink-0 text-primary fill-primary/20" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
            </div>
            <Button
              variant={user.isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleFollow}
              disabled={loading}
              className={cn(
                'flex-shrink-0',
                user.isFollowing && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive',
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                user.isFollowing ? label('following') : label('follow')
              )}
            </Button>
          </div>

          {user.bio && (
            <p className="mt-2 text-sm text-foreground line-clamp-2 flex-shrink-0">{user.bio}</p>
          )}

          {(user.role || user.company || user.location) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
              {(user.role || user.company) && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 flex-shrink-0" />
                  {[roleLabel, user.company].filter(Boolean).join(' · ')}
                </span>
              )}
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {user.location}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 flex gap-6 text-sm border-t border-border/50">
            <span className="flex items-baseline gap-1">
              <strong className="text-foreground tabular-nums min-w-[3rem] text-right inline-block">{(user.followers ?? 0).toLocaleString()}</strong>
              <span className="text-muted-foreground whitespace-nowrap">{label('followers')}</span>
            </span>
            <span className="flex items-baseline gap-1">
              <strong className="text-foreground tabular-nums min-w-[3rem] text-right inline-block">{(user.following ?? 0).toLocaleString()}</strong>
              <span className="text-muted-foreground whitespace-nowrap">{label('following')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const People = () => {
  const navigate = useNavigate();
  const { query: queryFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const queryFromSearch = searchParams.get('q') || '';
  const initialQuery = queryFromPath?.trim() || queryFromSearch || '';
  const { language } = useLanguage();
  const label = (key) => t(language, `people.${key}`);
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.userId ?? '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [peopleSentinelRef, setPeopleSentinelRef] = useState(null);

  const fetchPeople = useCallback(async (query, pageNum, append = false) => {
    try {
      if (append) {setLoadingMore(true);}
      else {setLoading(true);}
      setError(null);
      const res = await searchUsers(query, pageNum, PAGE_SIZE);
      const mapped = (res.data || [])
        .filter((u) => u.userId !== currentUserId)
        .map((u) => ({
          userId: u.userId,
          id: u.userId,
          name: u.displayName || u.handle,
          handle: u.handle,
          profileSlug: u.profileSlug || u.handle,
          avatar: u.avatarUrl || null,
          bio: u.bio,
          role: u.role,
          company: u.company,
          location: u.location,
          followers: u.followersCount ?? 0,
          following: u.followingCount ?? 0,
          isVerified: u.isVerified ?? false,
          isFollowing: u.isFollowing ?? false,
        }));
      setUsers((prev) => (append ? [...prev, ...mapped] : mapped));
      setTotalCount(res.totalCount ?? 0);
      setTotalPages(res.totalPages ?? 0);
      setPage(res.page ?? pageNum);
    } catch (err) {
      setError(err.message || 'Failed to load people');
      if (!append) {setUsers([]);}
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUserId]);

  // Sync URL (path or query) to local state when navigating to /people/search/... or /people?q=...
  useEffect(() => {
    const qParam = queryFromPath?.trim() || queryFromSearch || '';
    setSearchQuery((prev) => (prev !== qParam ? qParam : prev));
  }, [queryFromPath, queryFromSearch]);

  // Fetch when search query changes; keep URL in sync (path /people/search/:query)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q) {
      const path = `/people/search/${encodeURIComponent(q)}`;
      if (queryFromPath !== q) {
        navigate(path, { replace: true });
      }
    } else if (queryFromPath) {
      navigate('/people', { replace: true });
    }
    const timer = setTimeout(() => fetchPeople(q, 1, false), q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPeople, queryFromPath, navigate]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading) {return;}
    const nextPage = page + 1;
    if (nextPage > totalPages) {return;}
    fetchPeople(searchQuery.trim(), nextPage, true);
  }, [page, totalPages, loadingMore, loading, searchQuery, fetchPeople]);

  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    const el = peopleSentinelRef;
    if (!el || loading) {return;}
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
  }, [peopleSentinelRef, loadMore, loading]);

  const handleFollowChange = (userId, isFollowing, loadingState) => {
    if (loadingState !== undefined) {
      setFollowLoadingId(loadingState ? userId : null);
    }
    if (isFollowing !== undefined) {
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === userId
            ? {
              ...u,
              isFollowing,
              followers: Math.max(0, u.followers + (isFollowing ? 1 : -1)),
            }
            : u,
        ),
      );
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            <LangText path="nav.people"  />
          </h1>
          <p className="text-muted-foreground mt-1">
            {label('subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative animate-fade-in" style={{ animationDelay: '50ms' }}>
          <ClearableSearchInput
            type="text"
            placeholder={label('searchPlaceholder')}
            aria-label={label('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputClassName="h-11"
            onClear={() => {
              setSearchQuery('');
              navigate('/people', { replace: true });
            }}
            clearAriaLabel={t('common.clearSearch')}
            dataTestId="people-search"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-destructive text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{totalCount.toLocaleString()}</strong>{' '}
            {label('peopleShownSuffix')}
          </p>
        </div>

        {/* People Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {users.map((user, index) => (
              <div key={user.userId} className="h-full" style={{ animationDelay: `${150 + (index * 50)}ms` }}>
                <PersonCard
                  user={user}
                  language={language}
                  onFollowChange={handleFollowChange}
                  loading={followLoadingId === user.userId}
                  onClick={() => navigate(`/profile/${user.profileSlug || user.handle}`)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel + loading indicator */}
        {!loading && users.length > 0 && (
          <div ref={setPeopleSentinelRef} className="min-h-[1px] py-4 flex justify-center items-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span><LangText path="people.loading_more"  /></span>
              </div>
            )}
            {!loadingMore && page >= totalPages && users.length > 0 && (
              <p className="text-sm text-muted-foreground py-2">
                {label('allPeopleShown')}
              </p>
            )}
          </div>
        )}

        {!loading && users.length === 0 && !error && (
          <p className="text-center text-muted-foreground py-12">
            <LangText path="layout.no_people_found"  />
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default People;
