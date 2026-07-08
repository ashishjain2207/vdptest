import { Plus, Menu, Loader2, FileText } from 'lucide-react';
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@imriva/framework';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppUser } from '@/hooks/useAppUser';
import { getAccessToken, hasSession, searchUsers, getDisplayNameFromAccessToken } from '@/services';
import { searchPosts } from '@/services/postService';
import { NotificationDropdown } from './NotificationDropdown';
import { HeaderFeedbackButton } from './HeaderFeedbackButton';
import { LanguageSelector } from './LanguageSelector';
import { CreatePost } from '@/components/post/CreatePost';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';


import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

export function Header({ onMenuClick, onPostCreated }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  const t = useT();
  const { user, logout, loading } = useAppUser();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchPostResults, setSearchPostResults] = useState([]);
  const [searchSuggestionsLoading, setSearchSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  /** Latest query for dropping stale async results (clear / edit while in flight). */
  const searchQueryRef = useRef('');
  searchQueryRef.current = searchQuery;

  useEffect(() => {
    if (isAdminRoute) {
      setIsCreateModalOpen(false);
    }
  }, [isAdminRoute]);

  // Live search: posts (keyword in content) + people (name/handle), debounced
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchSuggestions([]);
      setSearchPostResults([]);
      setShowSuggestions(false);
      setSearchSuggestionsLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchSuggestionsLoading(true);
      try {
        const [usersRes, postsRes] = await Promise.all([
          searchUsers(q, 1, 8),
          searchPosts(q, 1, 5, { showLoader: false }),
        ]);
        if (cancelled) {
          return;
        }
        if (searchQueryRef.current.trim() !== q) {
          return;
        }
        setSearchSuggestions(usersRes?.data ?? []);
        setSearchPostResults(postsRes?.data ?? []);
        setShowSuggestions(true);
      } catch {
        if (!cancelled) {
          setSearchSuggestions([]);
          setSearchPostResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchSuggestionsLoading(false);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSuggestionSelect = (profileSlug, handle) => {
    navigate(`/profile/${profileSlug || handle}`);
    setSearchQuery('');
    setSearchSuggestions([]);
    setSearchPostResults([]);
    setShowSuggestions(false);
    setSearchFocused(false);
  };

  const handlePostSelect = (postId) => {
    if (postId) { navigate(`/posts/${postId}`); }
    setSearchQuery('');
    setSearchSuggestions([]);
    setSearchPostResults([]);
    setShowSuggestions(false);
    setSearchFocused(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    const q = (typeof searchQuery === 'string' ? searchQuery : '').trim();
    // Go to Explore with ?q= for full results (posts + people)
    if (q) {
      navigate(`/explore?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/explore');
    }
    setSearchQuery('');
    setSearchSuggestions([]);
    setSearchPostResults([]);
    setShowSuggestions(false);
    setSearchFocused(false);
  };

  const handleSearchBlur = () => {
    // Delay hiding so click on suggestion can register (mousedown fires before blur)
    setTimeout(() => setShowSuggestions(false), 150);
    setSearchFocused(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Get user display values with fallbacks (Redux + JWT when profile hydration lags)
  const tokenDisplayName = getDisplayNameFromAccessToken(getAccessToken());
  const userAvatar = user?.avatarUrl;
  const userName = user?.displayName || user?.handle || tokenDisplayName || 'User';
  const userHandle = user?.handle || '';
  
  // Always show avatar icon if user is logged in (has token) or if user data exists
  const isAuthenticated = Boolean(getAccessToken()) || hasSession() || user;
  const showAvatar = isAuthenticated;

  return (
    <>
      <header className="app-header relative z-[9999] w-full shrink-0 min-h-14 py-2 border-b border-border px-3 sm:px-4 lg:px-6 safe-top safe-inset-x shadow-md outline-none focus:outline-none [&_*]:outline-none [&_*]:focus:outline-none [&_*]:focus:ring-0">
        <div className="h-full flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label={t('layout.open_navigation_menu')}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search with live suggestions */}
          <form
            className={cn(
              'relative flex-1 min-w-0 max-w-[16rem] sm:max-w-sm lg:max-w-md transition-all duration-200',
              searchFocused && 'sm:max-w-md lg:max-w-lg',
            )}
            onSubmit={handleSearchSubmit}
          >
            <ClearableSearchInput
              placeholder={t('feed.searchPostsAndPeople')}
              inputClassName="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              searchIconClassName="left-3 w-4 h-4 z-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={handleSearchBlur}
              onClear={() => {
                setSearchQuery('');
                setSearchSuggestions([]);
                setSearchPostResults([]);
                setShowSuggestions(false);
              }}
              clearAriaLabel={t('common.clearSearch')}
              aria-label={t('layout.search_posts_and_people')}
              dataTestId="header-global-search"
            />
            {/* Suggestions dropdown: posts (keyword) + people */}
            {showSuggestions && searchQuery.trim().length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-[10000]">
                {searchSuggestionsLoading ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm"><LangText path="layout.searching"  /></span>
                  </div>
                ) : (
                  <>
                    {/* Posts (keyword in content) */}
                    {searchPostResults.length > 0 && (
                      <div className="py-1 border-b border-border">
                        <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <LangText path="layout.posts"  />
                        </p>
                        <ul className="py-0.5">
                          {searchPostResults.map((p) => {
                            const id = p.id ?? p.Id;
                            const content = (p.content ?? p.Content ?? '').slice(0, 80);
                            const author = p.authorDisplayName ?? p.AuthorDisplayName ?? '';
                            return (
                              <li key={id}>
                                <button
                                  type="button"
                                  className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handlePostSelect(id);
                                  }}
                                >
                                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground line-clamp-2">{content}{((p.content ?? p.Content)?.length > 80) ? '…' : ''}</p>
                                    {author && <p className="text-xs text-muted-foreground mt-0.5">{author}</p>}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {/* People */}
                    <div className="py-1">
                      <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <LangText path="nav.people"  />
                      </p>
                      {searchSuggestions.length > 0 ? (
                        <ul className="py-0.5">
                          {searchSuggestions.map((u) => (
                            <li key={u.userId ?? u.UserId}>
                              <button
                                type="button"
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSuggestionSelect(u.profileSlug ?? u.ProfileSlug, u.handle ?? u.Handle);
                                }}
                              >
                                <Avatar className="w-9 h-9 flex-shrink-0">
                                  {(u.avatarUrl ?? u.AvatarUrl) ? (
                                    <AvatarImage src={u.avatarUrl ?? u.AvatarUrl} alt={u.displayName ?? u.DisplayName} />
                                  ) : null}
                                  <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-xs font-medium">
                                    {getInitials((u.displayName ?? u.DisplayName) || (u.handle ?? u.Handle))}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{(u.displayName ?? u.DisplayName) || (u.handle ?? u.Handle)}</p>
                                  <p className="text-xs text-muted-foreground truncate">@{u.handle ?? u.Handle}</p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-4 py-2 text-sm text-muted-foreground"><LangText path="layout.no_people_found"  /></p>
                      )}
                    </div>
                    {/* See all link */}
                    <div className="border-t border-border p-2">
                      <button
                        type="button"
                        className="w-full text-center text-sm text-primary hover:underline py-1"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSearchSubmit(e);
                        }}
                      >
                        <LangText path="layout.see_all_results"  />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </form>

          {/* Actions - extra gap on lg+ for tablet/smart display (e.g. Nest Hub) */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
            {!isAdminRoute ? (
              <>
                <Button
                  className="hidden sm:flex gap-2 shadow-soft"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span><LangText path="feed.createPost"  /></span>
                </Button>
                <Button
                  size="icon"
                  className="sm:hidden shadow-soft"
                  onClick={() => setIsCreateModalOpen(true)}
                  aria-label={t('feed.createPost')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </>
            ) : null}

            {/* Language Selector - dropdown opens below header for clean display */}
            <LanguageSelector />

            {/* Notifications */}
            <NotificationDropdown />

            {/* Feedback (after notifications) */}
            {!isAdminRoute ? <HeaderFeedbackButton /> : null}

            {/* User Menu - Always show if user exists or is loading */}
            {showAvatar && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-10 w-10 rounded-full p-0 hover:bg-accent" 
                    disabled={loading && !user}
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                      {loading && !user ? (
                        <AvatarFallback className="animate-pulse bg-muted">...</AvatarFallback>
                      ) : (
                        <>
                          {userAvatar ? (
                            <AvatarImage src={userAvatar} alt={userName} />
                          ) : null}
                          <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                            {getInitials(userName)}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card z-[99999]" align="end" forceMount>
                  {(() => {
                    if (loading && !user && !tokenDisplayName) {
                      return (
                        <div className="flex items-center gap-3 p-3">
                          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      );
                    }

                    if (isAuthenticated) {
                      return (
                        <>
                          <div className="flex items-center gap-3 p-3">
                            <Avatar className="h-10 w-10">
                              {userAvatar ? (
                                <AvatarImage src={userAvatar} alt={userName} />
                              ) : null}
                              <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                                {getInitials(userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{userName}</p>
                              {userHandle ? (
                                <p className="text-xs text-muted-foreground truncate">@{userHandle}</p>
                              ) : null}
                            </div>
                          </div>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const handle = user?.handle;
                              const slug = user?.profileSlug;

                              if (handle && typeof handle === 'string' && handle.trim().length > 0) {
                                navigate(`/profile/${handle.trim()}`);
                                return;
                              }

                              if (slug && typeof slug === 'string' && slug.trim().length > 0) {
                                navigate(`/profile/${slug.trim()}`);
                                return;
                              }

                              navigate('/settings/profile');
                            }}
                          >
                            <LangText path="admin.view_profile"  />
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/settings/account')}>
                            <LangText path="accountSettings.title"  />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={handleLogout}
                          >
                            <LangText path="admin.log_out"  />
                          </DropdownMenuItem>
                        </>
                      );
                    }

                    // Not logged in
                    return (
                      <div className="p-3 text-sm text-muted-foreground">
                        <LangText path="admin.not_logged_in"  />
                      </div>
                    );
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {!isAdminRoute ? (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0 p-4 pb-0">
              <DialogTitle><LangText path="layout.create_post"  /></DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <CreatePost
                variant="modal"
                onPostCreated={onPostCreated}
                onOpenChange={() => setIsCreateModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
