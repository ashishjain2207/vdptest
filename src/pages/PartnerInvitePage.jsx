import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Button,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { useT, useTParams } from '@/i18n';
import { toast } from 'sonner';
import {
  getPartnerByHandle,
  getPartnerById,
  createPartnerInvite,
  getPartnerMembers,
  listPartnerInvites,
} from '@/services/partnerService';
import { partnerPath } from '@/lib/appRoutes';
import { searchUsers } from '@/services/suggestedPeopleService';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

/** @param {string | undefined} s */
function looksLikeGuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ''));
}

/** Case-insensitive compare (GUID casing and legacy id quirks). */
function sameIdOrHandle(a, b) {
  const x = String(a ?? '').trim();
  const y = String(b ?? '').trim();
  if (!x || !y) {
    return false;
  }
  return x.toLowerCase() === y.toLowerCase();
}

/** Normalize user id for Maps/Sets (invite rows use consistent casing). */
function normUserId(id) {
  return String(id ?? '').trim().toLowerCase();
}

/** Normalize profile handle for Maps (ignore leading @, case-insensitive). */
function normHandle(h) {
  return String(h ?? '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

/**
 * Load all member rows for an org (paginated API).
 * @param {string} organizationId
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function fetchAllPartnerMembers(organizationId) {
  const pageSize = 200;
  let page = 1;
  /** @type {Array<Record<string, unknown>>} */
  let all = [];
  let totalPages = 1;
  do {
    const res = await getPartnerMembers(organizationId, page, pageSize);
    const raw = res?.data ?? res?.items ?? [];
    const chunk = Array.isArray(raw) ? raw : [];
    all = all.concat(chunk);
    totalPages = Math.max(1, res?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);
  return all;
}

/**
 * Whether a user-search row is the logged-in user (must not appear as invite target).
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown> | null | undefined} authUser
 */
function isRowCurrentUser(row, authUser) {
  if (!authUser) {
    return false;
  }
  const rowUid = String(row.userId ?? row.UserId ?? '').trim();
  const authUid = String(authUser.userId ?? '').trim();
  if (rowUid && authUid && sameIdOrHandle(rowUid, authUid)) {
    return true;
  }
  const rowHandle = String(row.handle ?? row.Handle ?? '').trim();
  const authHandle = String(authUser.handle ?? '').trim();
  return Boolean(rowHandle && authHandle && sameIdOrHandle(rowHandle, authHandle));
}

const ROLE_OPTIONS = ['Member', 'Moderator', 'Admin'];

/** @param {string} role @param {boolean} banned */
function partnerRoleBadgeClass(role, banned) {
  if (banned) {
    return 'bg-destructive/15 text-destructive border-destructive/30';
  }
  if (role === 'Admin') {
    return 'bg-[hsl(var(--heading))]/15 text-[hsl(var(--heading))] border-[hsl(var(--heading))]/30';
  }
  if (role === 'Moderator') {
    return 'bg-primary/10 text-primary border-primary/30';
  }
  return 'border-border text-muted-foreground';
}

/**
 * Invite users to a partner by profile search (handle / display name).
 */
const PartnerInvitePage = () => {
  const t = useT();
  const tr = useTParams();
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [partner, setPartner] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState('Member');
  const [invitingId, setInvitingId] = useState(/** @type {string | null} */ (null));
  const [memberByUserId, setMemberByUserId] = useState(
    /** @type {Record<string, { role: string, isBanned: boolean }>} */ ({}),
  );
  const [memberByHandle, setMemberByHandle] = useState(
    /** @type {Record<string, { role: string, isBanned: boolean }>} */ ({}),
  );
  const [pendingInviteByUserId, setPendingInviteByUserId] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [contextLoading, setContextLoading] = useState(false);

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

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const orgId = partner ? String(partner.id ?? partner.Id ?? '') : '';
  const canManage = partner?.canManageMembers === true || partner?.CanManageMembers === true;
  const canAssignRoles = partner?.canAssignRoles === true || partner?.CanAssignRoles === true;

  const loadInviteContext = useCallback(async () => {
    if (!orgId || !canManage) {
      return;
    }
    setContextLoading(true);
    try {
      const [members, invites] = await Promise.all([
        fetchAllPartnerMembers(orgId),
        listPartnerInvites(orgId),
      ]);
      /** @type {Record<string, { role: string, isBanned: boolean }>} */
      const map = {};
      /** @type {Record<string, { role: string, isBanned: boolean }>} */
      const byHandle = {};
      for (const m of members) {
        const entry = {
          role: String(m.role ?? m.Role ?? 'Member'),
          isBanned: Boolean(m.isBanned ?? m.IsBanned),
        };
        const id = normUserId(m.userId ?? m.UserId ?? '');
        if (id) {
          map[id] = entry;
        }
        const mh = normHandle(m.handle ?? m.Handle ?? '');
        if (mh) {
          byHandle[mh] = entry;
        }
      }
      /** @type {Record<string, boolean>} */
      const pending = {};
      const invList = Array.isArray(invites) ? invites : [];
      for (const inv of invList) {
        const iid = normUserId(inv.inviteeUserId ?? inv.InviteeUserId ?? '');
        if (iid) {
          pending[iid] = true;
        }
      }
      setMemberByUserId(map);
      setMemberByHandle(byHandle);
      setPendingInviteByUserId(pending);
    } catch {
      setMemberByUserId({});
      setMemberByHandle({});
      setPendingInviteByUserId({});
    } finally {
      setContextLoading(false);
    }
  }, [orgId, canManage]);

  /** Resolve roster row by user id and/or handle (handles id casing quirks). */
  const resolvePartnerMember = useCallback(
    (uid, handle) => {
      const nid = normUserId(uid);
      if (nid && memberByUserId[nid]) {
        return memberByUserId[nid];
      }
      const nh = normHandle(handle);
      if (nh && memberByHandle[nh]) {
        return memberByHandle[nh];
      }
      return undefined;
    },
    [memberByUserId, memberByHandle],
  );

  useEffect(() => {
    if (orgId && canManage) {
      void loadInviteContext();
    }
  }, [orgId, canManage, loadInviteContext]);
  const partnerName = String(partner?.name ?? '');
  const slug = partner ? String(partner.handle ?? partnerId) : '';

  const inviteRoleOptions = canAssignRoles ? ROLE_OPTIONS : ['Member'];

  useEffect(() => {
    if (!canAssignRoles && (inviteRole === 'Admin' || inviteRole === 'Moderator')) {
      setInviteRole('Member');
    }
  }, [canAssignRoles, inviteRole]);

  useEffect(() => {
    let cancelled = false;
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      return () => { cancelled = true; };
    }
    setSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(q, 1, 25, {
          countryCode: String(partner?.countryCode ?? partner?.CountryCode ?? '').trim().toUpperCase(),
        });
        const raw = res?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const filtered = list.filter((row) => !isRowCurrentUser(row, authUser));
        if (!cancelled) {
          setResults(filtered);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, authUser, partner?.countryCode, partner?.CountryCode]);

  useEffect(() => {
    if (!loading && partner && !canManage) {
      toast.error(t('toasts.noPermissionInvitePartner'));
      navigate(partnerPath(slug || partnerId || ''), { replace: true });
    }
  }, [loading, partner, canManage, navigate, partnerId, slug]);

  /** @param {string} userId @param {string} handle */
  const inviteUser = async (userId, handle) => {
    const uid = String(userId ?? '').trim();
    const h = String(handle ?? '').trim();
    if (!orgId || (!uid && !h)) {
      return;
    }
    if (contextLoading) {
      return;
    }
    const nid = normUserId(uid);
    const m = resolvePartnerMember(uid, h);
    if (m && !m.isBanned) {
      toast.error(tr('toasts.alreadyOnPartner', { role: m.role }));
      return;
    }
    if (nid && pendingInviteByUserId[nid]) {
      toast.error(t('toasts.inviteAlreadyPending'));
      return;
    }
    if (authUser) {
      if (uid && sameIdOrHandle(uid, authUser.userId)) {
        toast.error(t('toasts.cannotInviteSelf'));
        return;
      }
      if (h && authUser.handle && sameIdOrHandle(h, authUser.handle)) {
        toast.error(t('toasts.cannotInviteSelf'));
        return;
      }
    }
    const busyKey = uid || h;
    setInvitingId(busyKey);
    try {
      /** @type {Record<string, string>} */
      const body = { role: inviteRole };
      if (uid) {
        body.inviteeUserId = uid;
      } else {
        body.handle = h;
      }
      await createPartnerInvite(orgId, body);
      toast.success(t('toasts.inviteSent'));
      setSearch('');
      setResults([]);
      await loadInviteContext();
    } catch (e) {
      toast.error(e?.message || t('toasts.inviteFailed'));
    } finally {
      setInvitingId(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto flex items-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <LangText path="common.loading"  />
        </div>
      </MainLayout>
    );
  }

  if (!partner) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <p className="text-destructive"><LangText path="admin.partner_not_found"  /></p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground" asChild>
          <Link to={partnerPath(slug)}>
            <ArrowLeft className="w-4 h-4" />
            <LangText path="common.back_to"  /> {partnerName}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <UserPlus className="w-8 h-8 text-[hsl(var(--heading))]" />
          <div>
            <h1 className="partner-admin-heading">
              <LangText path="common.invite_users"  />
            </h1>
            <p className="partner-admin-subheading">{partnerName}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          {contextLoading ? (
            <div className="flex items-center gap-1 py-0.5" aria-busy="true">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-sm font-medium"><LangText path="common.role_for_invite"  /></Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {inviteRoleOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ClearableSearchInput
            inputClassName="h-11 rounded-lg"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            clearAriaLabel="Clear search"
            aria-label="Search users to invite"
            dataTestId="partner-invite-page-search"
          />
          {searchLoading ? (
            <div className="flex items-center gap-1 py-0.5" aria-busy="true">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : null}

          <ul className="divide-y divide-border rounded-lg border border-border max-h-96 overflow-auto">
            {results.map((row) => {
              const uid = String(row.userId ?? row.UserId ?? '');
              const dn = String(row.displayName ?? row.DisplayName ?? '');
              const h = String(row.handle ?? row.Handle ?? '');
              const av = String(row.avatarUrl ?? row.AvatarUrl ?? '');
              const canInvite = Boolean(uid || h);
              const busyKey = uid || h;
              const nid = normUserId(uid);
              const mem = resolvePartnerMember(uid, h);
              const isActiveMember = Boolean(mem && !mem.isBanned);
              const isPendingInvite = Boolean(nid && pendingInviteByUserId[nid]);
              const profileSubtitle = [row.role, row.company].filter(Boolean).join(' · ');
              const handleCompany = [h ? `@${h}` : '', row.company].filter(Boolean).join(' · ');
              const subtitle = isActiveMember
                ? (handleCompany || (h ? `@${h}` : '') || String(row.company ?? ''))
                : (profileSubtitle || (h ? `@${h}` : ''));
              return (
                <li key={uid || h || dn} className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={av || undefined} alt="" />
                    <AvatarFallback>{(dn || h).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{dn || h}</div>
                    <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isActiveMember && mem ? (
                      <Badge variant="outline" className={`text-xs font-medium ${partnerRoleBadgeClass(mem.role, false)}`}>
                        <LangText path="common.partner_role"  />: {mem.role}
                      </Badge>
                    ) : null}
                    {mem?.isBanned ? (
                      <Badge variant="outline" className={`text-xs font-medium ${partnerRoleBadgeClass(mem.role, true)}`}>
                        <LangText path="common.banned"  />
                      </Badge>
                    ) : null}
                    {isPendingInvite && !isActiveMember ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-lg" disabled>
                        <LangText path="common.invite_pending"  />
                      </Button>
                    ) : null}
                    {!isActiveMember && !isPendingInvite ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground gap-1"
                        disabled={contextLoading || !canInvite || invitingId === busyKey}
                        onClick={() => void inviteUser(uid, h)}
                      >
                        {invitingId === busyKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        <LangText path="common.invite"  />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {search.trim().length >= 2 && results.length === 0 && !searchLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              <LangText path="partners.no_users_found"  />
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PartnerInvitePage;
