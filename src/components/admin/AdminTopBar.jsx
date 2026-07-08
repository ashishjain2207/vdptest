import { Menu } from 'lucide-react';
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
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken, hasSession } from '@/services';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';


import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import { HeaderFeedbackButton } from '@/components/layout/HeaderFeedbackButton';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { getAdminPageTitle } from './adminTitles';
import { PlatformStaffCountryScopeControl } from '@/components/admin/PlatformStaffCountryScopeControl.jsx';

/**
 * @param {{ onMenuClick?: () => void }} props
 */
export function AdminTopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const title = getAdminPageTitle(pathname);

  const userAvatar = user?.avatarUrl;
  const userName = user?.displayName || user?.handle || 'User';
  const userHandle = user?.handle || '';
  const isAuthenticated = Boolean(getAccessToken()) || hasSession() || user;
  const showAvatar = isAuthenticated;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4 safe-top">
      <div className="flex min-w-0 items-center gap-2">
        <Button type="button" variant="ghost" size="icon" className="md:hidden flex-shrink-0" onClick={onMenuClick} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate">
          <LangText path={title.path} />
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <PlatformStaffCountryScopeControl />
        <LanguageSelector />
        <NotificationDropdown />
        <HeaderFeedbackButton />
        {showAvatar && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-accent" disabled={loading && !user}>
                <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  {loading && !user ? (
                    <AvatarFallback className="animate-pulse bg-muted">…</AvatarFallback>
                  ) : (
                    <>
                      {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
                      <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card z-[99999]" align="end" forceMount>
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3">
                    <Avatar className="h-10 w-10">
                      {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
                      <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userName}</p>
                      {userHandle ? <p className="text-xs text-muted-foreground truncate">@{userHandle}</p> : null}
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
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LangText path="admin.log_out"  />
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">
                  <LangText path="admin.not_logged_in"  />
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
