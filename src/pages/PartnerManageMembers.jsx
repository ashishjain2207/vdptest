import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPartnerByHandle,
  getPartnerById,
  getPartnerMembers,
  setPartnerMemberRole,
  banPartnerMember,
  unbanPartnerMember,
  removePartnerMember,
} from '@/services/partnerService';
import { partnerPath, partnerInvitePath, profilePath } from '@/lib/appRoutes';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, MoreVertical, UserPlus } from 'lucide-react';

/** @param {string | undefined} s */
function looksLikeGuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ''));
}

/**
 * Partner moderators: member list with search and role actions (mock-aligned).
 */
const PartnerManageMembers = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const t = useT();

  const [partner, setPartner] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState(/** @type {unknown[]} */ ([]));
  const [membersLoading, setMembersLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState(
    /** @type {{ type: 'ban' | 'remove', userId: string, label: string } | null} */ (null),
  );
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadPartner = useCallback(async () => {
    if (!partnerId) {
      return;
    }
    setLoading(true);
    try {
      const p = looksLikeGuid(partnerId)
        ? await getPartnerById(partnerId)
        : await getPartnerByHandle(partnerId);
      setPartner(p);
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoadPartner'));
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const orgId = partner ? String(partner.id ?? partner.Id ?? '') : '';
  const canManageMembers = partner?.canManageMembers === true || partner?.CanManageMembers === true;
  const canAssignRoles = partner?.canAssignRoles === true || partner?.CanAssignRoles === true;
  const partnerName = String(partner?.name ?? '');
  const slug = partner ? String(partner.handle ?? partnerId) : '';

  const loadMembers = useCallback(async () => {
    if (!orgId) {
      return;
    }
    setMembersLoading(true);
    try {
      const res = await getPartnerMembers(orgId, 1, 200);
      const raw = res?.data ?? res?.items ?? [];
      setMembers(Array.isArray(raw) ? raw : []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  useEffect(() => {
    if (!partner || !canManageMembers) {
      return;
    }
    void loadMembers();
  }, [partner, canManageMembers, loadMembers]);

  useEffect(() => {
    if (!loading && partner && !canManageMembers) {
      toast.error(t('toasts.noPermissionViewPage'));
      navigate(partnerPath(slug || partnerId || ''), { replace: true });
    }
  }, [loading, partner, canManageMembers, navigate, partnerId, slug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return members;
    }
    return members.filter((m) => {
      const row = /** @type {{ displayName?: string, DisplayName?: string, handle?: string, Handle?: string }} */ (m);
      const dn = String(row.displayName ?? row.DisplayName ?? '').toLowerCase();
      const h = String(row.handle ?? row.Handle ?? '').toLowerCase();
      return dn.includes(q) || h.includes(q);
    });
  }, [members, query]);

  const handleRole = async (userId, role) => {
    if (!orgId) {
      return;
    }
    try {
      await setPartnerMemberRole(orgId, userId, { role });
      toast.success(t('toasts.roleUpdated'));
      await loadMembers();
    } catch (e) {
      toast.error(e?.message || t('toasts.updateFailed'));
    }
  };

  const handleUnban = async (userId) => {
    if (!orgId) {
      return;
    }
    try {
      await unbanPartnerMember(orgId, userId);
      toast.success(t('toasts.banLifted'));
      await loadMembers();
    } catch (e) {
      toast.error(e?.message || t('toasts.unbanFailed'));
    }
  };

  /** @param {string} userId @param {string} label */
  const handleBan = (userId, label) => {
    setConfirmAction({ type: 'ban', userId, label: String(label) });
  };

  const runConfirmedAction = async () => {
    if (!confirmAction || !orgId) {
      return;
    }
    setConfirmBusy(true);
    try {
      if (confirmAction.type === 'ban') {
        await banPartnerMember(orgId, confirmAction.userId, {});
        toast.success(t('toasts.userBanned'));
      } else {
        await removePartnerMember(orgId, confirmAction.userId);
        toast.success(t('toasts.removed'));
      }
      await loadMembers();
      setConfirmAction(null);
    } catch (e) {
      toast.error(e?.message || (confirmAction.type === 'ban' ? t('toasts.banFailed') : t('toasts.removeFailed')));
    } finally {
      setConfirmBusy(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto flex items-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <LangText path="common.loading"  />
        </div>
      </MainLayout>
    );
  }

  if (!partner) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto p-6">
          <p className="text-destructive"><LangText path="admin.partner_not_found"  /></p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/partners')}>
            <LangText path="layout.back"  />
          </Button>
        </div>
      </MainLayout>
    );
  }

  const roleBadgeClass = (role, banned) => {
    if (banned) {
      return 'bg-destructive/15 text-destructive border-destructive/30';
    }
    if (role === 'Admin') {
      return 'bg-[hsl(var(--heading))]/15 text-[hsl(var(--heading))] border-[hsl(var(--heading))]/30';
    }
    return 'border-border text-muted-foreground';
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground" asChild>
          <Link to={partnerPath(slug)}>
            <ArrowLeft className="w-4 h-4" />
            <LangText path="common.back_to"  /> {partnerName}
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="partner-admin-heading">
              {canAssignRoles ? (
                <LangText path="common.manage_members"  />
              ) : (
                <LangText path="partners.members"  />
              )}
            </h1>
            <p className="partner-admin-subheading">{partnerName}</p>
            {!canAssignRoles && canManageMembers ? (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                <LangText path="common.you_can_view_the_member_list_only_partner_admins_can_change_"
                />
              </p>
            ) : null}
          </div>
          <Button
            asChild
            className="rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground gap-2"
          >
            <Link to={partnerInvitePath(slug)}>
              <UserPlus className="w-4 h-4" />
              <LangText path="common.invite_users_2"  />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <ClearableSearchInput
              inputClassName="h-10 rounded-lg"
              placeholder="Search members…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              clearAriaLabel="Clear search"
              aria-label="Search members"
              dataTestId="partner-manage-members-search"
            />
          </div>

          {membersLoading ? (
            <div className="flex items-center gap-2 p-8 text-muted-foreground justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((member) => {
                const m = /** @type {{ userId?: string, UserId?: string, displayName?: string, DisplayName?: string, handle?: string, Handle?: string, avatarUrl?: string, AvatarUrl?: string, role?: string, Role?: string, isBanned?: boolean, IsBanned?: boolean }} */ (member);
                const uid = m.userId ?? m.UserId ?? '';
                const display = m.displayName ?? m.DisplayName ?? m.handle ?? m.Handle ?? uid;
                const avatar = m.avatarUrl ?? m.AvatarUrl ?? '';
                const role = m.role ?? m.Role ?? 'Member';
                const banned = m.isBanned ?? m.IsBanned ?? false;
                const isSelf = authUser?.userId && uid === authUser.userId;
                return (
                  <li key={uid} className="flex items-center gap-3 p-4 hover:bg-muted/20">
                    <button
                      type="button"
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => navigate(profilePath(m.handle ?? m.Handle ?? uid))}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={avatar || undefined} alt="" />
                        <AvatarFallback>{String(display).slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{display}</div>
                        <div className="text-xs text-muted-foreground truncate">@{m.handle ?? m.Handle ?? '—'}</div>
                      </div>
                    </button>
                    <span className={`hidden sm:inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(role, banned)}`}>
                      {banned ? <LangText path="common.banned"  /> : role}
                    </span>
                    {!isSelf && canAssignRoles ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Actions">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {canAssignRoles && role !== 'Admin' ? (
                            <DropdownMenuItem onClick={() => handleRole(uid, 'Admin')}>
                              <LangText path="common.make_admin_2"  />
                            </DropdownMenuItem>
                          ) : null}
                          {canAssignRoles && role !== 'Moderator' ? (
                            <DropdownMenuItem onClick={() => handleRole(uid, 'Moderator')}>
                              <LangText path="common.make_moderator"  />
                            </DropdownMenuItem>
                          ) : null}
                          {canAssignRoles && role !== 'Member' ? (
                            <DropdownMenuItem onClick={() => handleRole(uid, 'Member')}>
                              <LangText path="common.make_member"  />
                            </DropdownMenuItem>
                          ) : null}
                          {!banned ? (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleBan(uid, display)}>
                              <LangText path="common.ban_user"  />
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUnban(uid)}>
                              <LangText path="common.unban_user"  />
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmAction({ type: 'remove', userId: uid, label: String(display) })}
                          >
                            <LangText path="common.remove_from_partner"  />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {!membersLoading && filtered.length === 0 && (
            <p className="p-8 text-center text-muted-foreground text-sm">
              <LangText path="common.no_members_match_your_search"  />
            </p>
          )}
        </div>

        <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && !confirmBusy && setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.type === 'ban' ? (
                  <LangText path="common.ban_this_user"  />
                ) : (
                  <LangText path="common.remove_from_partner_2"  />
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.type === 'ban' ? (
                  <>
                    <LangText path="common.they_will_lose_access_to_this_partners_content_and_actions_y"
                    />
                    {confirmAction?.label ? (
                      <span className="block mt-2 font-medium text-foreground">{confirmAction.label}</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <LangText path="common.this_removes_their_membership_from_the_partner_they_can_be_i"
                    />
                    {confirmAction?.label ? (
                      <span className="block mt-2 font-medium text-foreground">{confirmAction.label}</span>
                    ) : null}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={confirmBusy}>
                <LangText path="common.cancel"  />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                disabled={confirmBusy}
                onClick={(e) => {
                  e.preventDefault();
                  void runConfirmedAction();
                }}
              >
                {confirmBusy ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : null}
                {confirmAction?.type === 'ban' ? (
                  <LangText path="common.ban_user"  />
                ) : (
                  <LangText path="posts.remove"  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default PartnerManageMembers;
