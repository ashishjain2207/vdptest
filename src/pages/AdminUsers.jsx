import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
} from '@imriva/framework';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LangText } from '@/components/ui/LangText';
import { toast } from 'sonner';
import {
  searchAdminUsers,
  getAssignablePlatformRoles,
  suspendAdminUser,
  unsuspendAdminUser,
  setAdminUserPlatformRole,
} from '@/services/adminUserService';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';


import { jobTitleLabel, formatRelativeTimeAgo } from '@/lib/displayLabels';
import { normalizeAdminUserStatus, platformRoleLabel } from '@/lib/adminUserDisplay';
import { profilePath } from '@/lib/appRoutes';
import { usePlatformAccess } from '@/lib/platformAuth';
import { FEED_EVENTS } from '@/lib/feedEvents';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

/** @param {'Active' | 'Suspended' | 'Pending'} status */
function StatusBadge({ status }) {
  const cls =
    status === 'Suspended'
      ? 'bg-destructive/15 text-destructive'
      : status === 'Pending'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', cls)}>
      {status === 'Suspended' ? (
        <LangText path="common.suspended"  />
      ) : status === 'Pending' ? (
        <LangText path="status.pending"  />
      ) : (
        <LangText path="status.active"  />
      )}
    </span>
  );
}

const AdminUsers = () => {
  const { country } = useAdminScopeCountry();
  const { isPlatformAdmin } = usePlatformAccess();
  const { language } = useLanguage();
  const t = useT();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const { showRefreshLoader: loading, endInitialFetch } = useRefreshOnlyFullPageLoader();
  const [pageBusy, setPageBusy] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [hideAdmins, setHideAdmins] = useState(false);
  const searchDebounceIsFirst = useRef(true);

  const [assignableRoles, setAssignableRoles] = useState(/** @type {Array<{ name: string, label: string }>} */ ([]));
  const [roleDialogUser, setRoleDialogUser] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [rolePick, setRolePick] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(query);
      if (!searchDebounceIsFirst.current) {
        setPage(1);
      }
      searchDebounceIsFirst.current = false;
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isPlatformAdmin) {
      return;
    }

    getAssignablePlatformRoles()
      .then((roles) => {
        const list = Array.isArray(roles) ? roles : [];
        setAssignableRoles(
          list.map((r) => ({
            name: String(r.name ?? r.Name ?? ''),
            label: String(r.label ?? r.Label ?? r.name ?? ''),
          })),
        );
      })
      .catch(() => {
        setAssignableRoles([
          { name: 'VdpConnect.Member', label: 'Member' },
          { name: 'VdpConnect.Support', label: 'Support' },
          { name: 'VdpConnect.Admin', label: 'Platform admin' },
        ]);
      });
  }, [isPlatformAdmin]);

  const load = useCallback(async () => {
    setPageBusy(true);
    try {
      const res = await searchAdminUsers(debouncedQ, page, PAGE_SIZE, { excludePlatformAdmins: hideAdmins });
      const raw = res?.data ?? res?.Data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setItems(
        hideAdmins
          ? list.filter(
            (row) =>
              String(row.platformRole ?? row.PlatformRole ?? '').toLowerCase() !== 'vdpconnect.admin',
          )
          : list,
      );
      setTotalPages(Number(res?.totalPages ?? res?.TotalPages ?? 0));
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoadUsers'));
      setItems([]);
      setTotalPages(0);
    } finally {
      setPageBusy(false);
      endInitialFetch();
    }
  }, [page, debouncedQ, hideAdmins, endInitialFetch]);

  useEffect(() => {
    void load();
  }, [load, country]);

  useEffect(() => {
    const onFeedChange = () => {
      void load();
    };
    window.addEventListener(FEED_EVENTS.POST_CREATED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
    return () => {
      window.removeEventListener(FEED_EVENTS.POST_CREATED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
    };
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [hideAdmins]);

  const profileLinkFor = (row) => {
    const slug = String(row.profileSlug ?? row.ProfileSlug ?? '').trim();
    const userId = String(row.userId ?? row.UserId ?? '');
    const key = slug || userId;
    return key ? profilePath(key) : null;
  };

  const handleSuspendToggle = async (row) => {
    const userId = String(row.userId ?? row.UserId ?? '');
    if (!userId) {
      return;
    }
    const status = normalizeAdminUserStatus(row.status ?? row.Status);
    setActionBusyId(userId);
    try {
      if (status === 'Suspended') {
        await unsuspendAdminUser(userId);
        toast.success(t('toasts.userUnsuspended'));
      } else {
        await suspendAdminUser(userId);
        toast.success(t('toasts.userSuspended'));
      }
      await load();
    } catch (e) {
      toast.error(e?.message || t('toasts.actionFailed'));
    } finally {
      setActionBusyId(null);
    }
  };

  const openRoleDialog = (row) => {
    const current = String(row.platformRole ?? row.PlatformRole ?? 'VdpConnect.Member');
    setRoleDialogUser(row);
    setRolePick(current);
  };

  const saveRole = async () => {
    const userId = String(roleDialogUser?.userId ?? roleDialogUser?.UserId ?? '');
    if (!userId || !rolePick) {
      return;
    }
    setRoleSaving(true);
    try {
      await setAdminUserPlatformRole(userId, rolePick);
      toast.success(t('toasts.roleUpdated'));
      setRoleDialogUser(null);
      await load();
    } catch (e) {
      toast.error(e?.message || t('toasts.roleSaveFailed'));
    } finally {
      setRoleSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12" data-testid="admin-users-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4" />
              <LangText path="admin.back_to_admin_dashboard"  />
            </Link>
          </Button>
          <h1 className="partner-admin-heading">
            <LangText path="nav.usersAndRoles"  />
          </h1>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={hideAdmins}
          onChange={(e) => setHideAdmins(e.target.checked)}
          className="rounded border-border"
        />
        <LangText path="admin.hide_administrators"  />
      </label>

      <ClearableSearchInput
        className="w-full"
        inputClassName="h-11 rounded-xl bg-card border-border shadow-sm"
        placeholder={t('people.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        clearAriaLabel={t('common.clearSearch')}
        dataTestId="admin-users-search"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16" aria-busy="true">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]" data-testid="admin-users-table">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.user"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.position"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.organization"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.status_2"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.platform_role"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.last_activity"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="layout.posts"  /></th>
                  <th className="p-4 font-semibold text-foreground text-right"><LangText path="admin.actions"  /></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const userId = String(row.userId ?? row.UserId ?? '');
                  const name = String(row.displayName ?? row.DisplayName ?? '');
                  const handle = String(row.handle ?? row.Handle ?? '');
                  const roleRaw = String(row.role ?? row.Role ?? '').trim();
                  const role =
                    roleRaw && roleRaw !== '—'
                      ? jobTitleLabel(roleRaw, lang)
                      : '—';
                  const company = String(row.company ?? row.Company ?? '—');
                  const avatar = String(row.avatarUrl ?? row.AvatarUrl ?? '');
                  const initials = (name || handle || '?').slice(0, 2);
                  const status = normalizeAdminUserStatus(row.status ?? row.Status);
                  const platformRole = String(row.platformRole ?? row.PlatformRole ?? 'VdpConnect.Member');
                  const lastAt = row.lastActivityAt ?? row.LastActivityAt;
                  const postsCount = Number(row.postsCount ?? row.PostsCount ?? 0);
                  const profileTo = profileLinkFor(row);
                  const busy = actionBusyId === userId;

                  return (
                    <tr key={userId || handle} className="border-b border-border/80 last:border-0 hover:bg-muted/20 transition-colors" data-testid="admin-user-row" data-user-id={userId}>
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <Avatar className="h-10 w-10 rounded-full border border-border">
                            <AvatarImage src={avatar || undefined} alt="" />
                            <AvatarFallback className="text-xs rounded-full">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground">{name || handle}</div>
                            <div className="text-muted-foreground text-xs">@{handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-[140px] truncate">{role}</td>
                      <td className="p-4 text-muted-foreground max-w-[120px] truncate">{company}</td>
                      <td className="p-4"><StatusBadge status={status} /></td>
                      <td className="p-4 text-muted-foreground max-w-[120px] truncate text-xs">
                        {platformRoleLabel(platformRole, lang)}
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap text-xs">
                        {lastAt ? formatRelativeTimeAgo(lastAt, lang) : '—'}
                      </td>
                      <td className="p-4 text-muted-foreground tabular-nums">{postsCount}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy} aria-label={t('admin.actions')} data-testid="admin-user-actions">
                              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {profileTo ? (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link to={profileTo}>
                                    <LangText path="admin.view_profile_2"  />
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`${profileTo}?tab=posts`}>
                                    <LangText path="admin.view_posts"  />
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            ) : null}
                            {isPlatformAdmin ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openRoleDialog(row)} data-testid="admin-user-change-role">
                                  <LangText path="admin.change_role"  />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleSuspendToggle(row)}
                                  className={status !== 'Suspended' ? 'text-destructive focus:text-destructive' : undefined}
                                  data-testid="admin-user-suspend-toggle"
                                >
                                  {status === 'Suspended' ? (
                                    <LangText path="admin.unsuspend_user"  />
                                  ) : (
                                    <LangText path="common.suspend_user"  />
                                  )}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">
              <LangText path="partners.no_users_found"  />
            </p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || pageBusy}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            <LangText path="admin.previous"  />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || pageBusy}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <LangText path="admin.next"  />
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isPlatformAdmin ? (
        <Dialog open={Boolean(roleDialogUser)} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                <LangText path="admin.change_platform_role"  />
              </DialogTitle>
              <DialogDescription>
                <LangText path="admin.change_platform_role_description"  />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="admin-user-role">
                <LangText path="admin.role"  />
              </Label>
              <select
                id="admin-user-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={rolePick}
                onChange={(e) => setRolePick(e.target.value)}
              >
                {assignableRoles.map((r) => (
                  <option key={r.name} value={r.name}>
                    {lang === 'DE' ? platformRoleLabel(r.name, 'DE') : r.label}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleDialogUser(null)} disabled={roleSaving}>
                <LangText path="common.cancel"  />
              </Button>
              <Button type="button" onClick={() => void saveRole()} disabled={roleSaving}>
                {roleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <LangText path="messages.save"  />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
};

export default AdminUsers;
