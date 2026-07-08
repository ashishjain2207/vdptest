import { MainLayout } from '@/components/layout/MainLayout';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { partnerManagePath, partnerInvitePath } from '@/lib/appRoutes';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Badge,
} from '@imriva/framework';
import { BadgeCheck, MapPin, ArrowLeft, Star, Loader2, UserPlus, Settings, LogOut } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PostCard } from '@/components/post/PostCard';
import { CreatePost } from '@/components/post/CreatePost';
import { EditPostModal } from '@/components/post/EditPostModal';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FramedImage } from '@/components/media/FramedImage';
import { normalizeImageDisplayFromApi } from '@/lib/imageCropMetadata';
import { COVER_BANNER_ASPECT_RATIO } from '@/lib/imageCropPresets';
import {
  getPartnerByHandle,
  getPartnerById,
  getPartnerPosts,
  getPartnerMembers,
  joinPartner,
  leavePartner,
  listMyPartnerInvites,
  acceptPartnerInvite,
  rejectPartnerInvite,
  acceptPartnerJoinRequest,
  rejectPartnerJoinRequest,
  listPartnerJoinRequests,
} from '@/services/partnerService';
import { REALTIME, dispatchRealtime } from '@/lib/realtimeEvents';
import { mapApiPostToFeedPost, mapApiPollToFeedPoll, prependUniqueFeedPost } from '@/lib/postMappers';
import { resolvePartnerMembersCount, adjustPartnerMembersCount } from '@/lib/partnerMappers';
import { useLanguage } from '@/contexts/LanguageContext';
import { locationLabel, partnerCategoryLabel } from '@/lib/displayLabels';

/** @param {string | undefined} s */
function looksLikeGuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(s || ''));
}

/** @param {unknown} role */
function roleIsAdmin(role) {
  return String(role ?? '').trim().toLowerCase() === 'admin';
}

/** @param {unknown} res - API paginated JSON */
function paginatedItems(res) {
  if (res === null || res === undefined || typeof res !== 'object') {
    return [];
  }
  const r = /** @type {{ data?: unknown[], Data?: unknown[], items?: unknown[], Items?: unknown[] }} */ (res);
  const arr = r.data ?? r.Data ?? r.items ?? r.Items;
  return Array.isArray(arr) ? arr : [];
}

const OrgDetail = () => {
  const { language } = useLanguage();
  const t = useT();
  const { partnerId, subId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const inviteHighlightRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const { user: authUser } = useAuth();

  const [partner, setPartner] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));

  const [orgPosts, setOrgPosts] = useState(/** @type {unknown[]} */ ([]));
  const [postsLoading, setPostsLoading] = useState(false);
  const [orgMembers, setOrgMembers] = useState(/** @type {unknown[]} */ ([]));
  const [membersLoading, setMembersLoading] = useState(false);

  const [joinBusy, setJoinBusy] = useState(false);
  /** Pending invite for this org (invitee), when not yet a member */
  const [pendingInvite, setPendingInvite] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [inviteBusy, setInviteBusy] = useState(false);
  /** Pending join requests for staff (loaded from API — only still-pending rows). */
  const [pendingJoinRequests, setPendingJoinRequests] = useState(/** @type {unknown[]} */ ([]));
  /** Scroll-to target when arriving from a join-request notification. */
  const [highlightJoinRequestId, setHighlightJoinRequestId] = useState(/** @type {string | null} */ (null));
  const [joinRequestBusyId, setJoinRequestBusyId] = useState(/** @type {string | null} */ (null));
  const [editingPost, setEditingPost] = useState(/** @type {Record<string, unknown> | null} */ (null));

  const loadPartner = useCallback(async () => {
    if (!partnerId) {
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const p = looksLikeGuid(partnerId)
        ? await getPartnerById(partnerId)
        : await getPartnerByHandle(partnerId);
      setPartner(p);
    } catch (e) {
      setLoadError(e?.message || 'Failed to load partner');
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  const bumpPartnerMembersCount = useCallback((delta) => {
    setPartner((prev) => adjustPartnerMembersCount(prev, delta));
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const orgId = partner ? String(partner.id ?? partner.Id ?? '') || null : null;
  const isPremium = partner?.tier === 'Premium' || partner?.isPremium === true;
  const canPost = partner?.canPost === true || partner?.CanPost === true;
  const canManage = partner?.canManageMembers === true || partner?.CanManageMembers === true;
  const canAssignRoles = partner?.canAssignRoles === true || partner?.CanAssignRoles === true;
  const viewerIsPlatformAdmin = partner?.viewerIsPlatformAdmin === true || partner?.ViewerIsPlatformAdmin === true;
  const isMember = partner?.isMember === true || partner?.IsMember === true;
  const isBanned = partner?.isBanned === true || partner?.IsBanned === true;
  const hasPendingJoinRequest =
    partner?.hasPendingJoinRequest === true || partner?.HasPendingJoinRequest === true;

  useEffect(() => {
    if (!orgId || !authUser?.userId || isMember) {
      setPendingInvite(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await listMyPartnerInvites();
        const raw = res?.data ?? res;
        const list = Array.isArray(raw) ? raw : [];
        const match = list.find(
          (inv) => String(inv.organizationId ?? inv.OrganizationId ?? '') === orgId,
        );
        if (!cancelled) {
          setPendingInvite(match ?? null);
        }
      } catch {
        if (!cancelled) {
          setPendingInvite(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, authUser?.userId, isMember]);

  /** From notification click: scroll to Accept / Decline when pending invite loads. */
  useEffect(() => {
    const st = location.state;
    if (!st?.highlightPendingInvite || !pendingInvite) {
      return;
    }
    const fromState = st.partnerInviteId;
    if (fromState) {
      const pid = String(pendingInvite.inviteId ?? pendingInvite.InviteId ?? '');
      if (pid && String(fromState).toLowerCase() !== pid.toLowerCase()) {
        return;
      }
    }
    const t = window.setTimeout(() => {
      inviteHighlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }, 200);
    return () => window.clearTimeout(t);
  }, [pendingInvite, location.state, location.pathname, location.search, navigate]);

  /** From notification click: remember which join request to scroll to after load. */
  useEffect(() => {
    const st = location.state;
    if (!st?.highlightJoinRequest || !st?.partnerJoinRequestId) {
      return;
    }
    setHighlightJoinRequestId(String(st.partnerJoinRequestId));
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [location.state, location.pathname, location.search, navigate]);

  const loadPendingJoinRequests = useCallback(async () => {
    if (!orgId || !canManage) {
      setPendingJoinRequests([]);
      return;
    }
    try {
      const raw = await listPartnerJoinRequests(orgId);
      setPendingJoinRequests(Array.isArray(raw) ? raw : []);
    } catch {
      setPendingJoinRequests([]);
    }
  }, [orgId, canManage]);

  useEffect(() => {
    void loadPendingJoinRequests();
  }, [loadPendingJoinRequests]);

  useEffect(() => {
    if (!highlightJoinRequestId || pendingJoinRequests.length === 0) {
      return;
    }
    const norm = (x) => String(x ?? '').toLowerCase();
    const target = norm(highlightJoinRequestId);
    const exists = pendingJoinRequests.some(
      (row) => norm(/** @type {{ id?: string, Id?: string }} */ (row).id ?? /** @type {{ Id?: string }} */ (row).Id) === target,
    );
    if (!exists) {
      setHighlightJoinRequestId(null);
      return;
    }
    const t = window.setTimeout(() => {
      const el = document.getElementById(`join-request-${highlightJoinRequestId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightJoinRequestId(null);
    }, 200);
    return () => window.clearTimeout(t);
  }, [highlightJoinRequestId, pendingJoinRequests]);

  const myRoleStr = String(partner?.myRole ?? partner?.MyRole ?? '').trim();
  const isPartnerAdmin = isMember && roleIsAdmin(myRoleStr);

  const canLeavePartnerProp = partner?.canLeavePartner ?? partner?.CanLeavePartner;
  const shouldLoadMembers = Boolean(orgId && authUser?.userId && isMember && !isBanned);

  const refreshFeedAndMembers = useCallback(async () => {
    if (!orgId) {
      return;
    }
    if (isBanned) {
      setOrgPosts([]);
      setOrgMembers([]);
      setPostsLoading(false);
      setMembersLoading(false);
      return;
    }
    setPostsLoading(true);
    setMembersLoading(shouldLoadMembers);
    try {
      const postsRes = await getPartnerPosts(orgId, 1, 30);
      const list = paginatedItems(postsRes);
      const avatar = authUser?.avatarUrl ?? '';
      // Map each API post so PostCard gets post.author.* from AuthorDisplayName/AuthorHandle (per real author — not the viewer).
      setOrgPosts(list.map((p) => mapApiPostToFeedPost(p, { currentUserAvatar: avatar })));

      if (shouldLoadMembers) {
        try {
          const membersRes = await getPartnerMembers(orgId, 1, 100);
          setOrgMembers(paginatedItems(membersRes));
        } catch {
          setOrgMembers([]);
        }
      } else {
        setOrgMembers([]);
      }
    } catch {
      setOrgPosts([]);
      setOrgMembers([]);
    } finally {
      setPostsLoading(false);
      setMembersLoading(false);
    }
  }, [orgId, shouldLoadMembers, authUser?.avatarUrl, isBanned]);

  useEffect(() => {
    if (!orgId) {
      return;
    }
    void refreshFeedAndMembers();
  }, [orgId, refreshFeedAndMembers]);

  const otherAdminsExist = useMemo(() => {
    const uid = authUser?.userId;
    if (!uid) {
      return false;
    }
    return orgMembers.some((row) => {
      const m = /** @type {{ userId?: string, UserId?: string, role?: string, Role?: string, isBanned?: boolean, IsBanned?: boolean }} */ (row);
      const id = m.userId ?? m.UserId ?? '';
      const role = m.role ?? m.Role ?? '';
      const banned = m.isBanned ?? m.IsBanned ?? false;
      return !banned && roleIsAdmin(role) && id !== uid;
    });
  }, [orgMembers, authUser?.userId]);

  const showLeave = useMemo(() => {
    if (!isMember || isBanned) {
      return false;
    }
    const v = canLeavePartnerProp;
    if (typeof v === 'boolean') {
      return v;
    }
    if (!isPartnerAdmin) {
      return true;
    }
    if (membersLoading) {
      return false;
    }
    return otherAdminsExist;
  }, [isMember, isBanned, isPartnerAdmin, membersLoading, otherAdminsExist, canLeavePartnerProp]);

  const handleJoin = async () => {
    if (!orgId) {
      return;
    }
    setJoinBusy(true);
    try {
      await joinPartner(orgId);
      toast.success(t('toasts.joinRequestSent'));
      setPartner((prev) => (prev
        ? { ...prev, hasPendingJoinRequest: true, HasPendingJoinRequest: true }
        : prev));
      await loadPartner();
    } catch (e) {
      toast.error(e?.message || t('toasts.couldNotJoin'));
    } finally {
      setJoinBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!orgId) {
      return;
    }
    setJoinBusy(true);
    try {
      await leavePartner(orgId);
      toast.success(t('toasts.leftPartner'));
      bumpPartnerMembersCount(-1);
      await loadPartner();
      await refreshFeedAndMembers();
    } catch (e) {
      toast.error(e?.message || t('toasts.couldNotLeave'));
    } finally {
      setJoinBusy(false);
    }
  };

  const pendingInviteId = pendingInvite
    ? String(pendingInvite.inviteId ?? pendingInvite.InviteId ?? '')
    : '';

  const handleAcceptInvite = async () => {
    if (!pendingInviteId) {
      return;
    }
    setInviteBusy(true);
    try {
      await acceptPartnerInvite({ inviteId: pendingInviteId });
      toast.success(<LangText path="common.you_joined_the_partner"  />);
      setPendingInvite(null);
      dispatchRealtime(REALTIME.notifications.SYNC);
      bumpPartnerMembersCount(1);
      await loadPartner();
      await refreshFeedAndMembers();
    } catch (e) {
      toast.error(e?.message || t('toasts.couldNotAcceptInvite'));
    } finally {
      setInviteBusy(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!pendingInviteId) {
      return;
    }
    setInviteBusy(true);
    try {
      await rejectPartnerInvite({ inviteId: pendingInviteId });
      toast.success(<LangText path="common.invite_declined"  />);
      setPendingInvite(null);
      dispatchRealtime(REALTIME.notifications.SYNC);
    } catch (e) {
      toast.error(e?.message || t('toasts.couldNotDeclineInvite'));
    } finally {
      setInviteBusy(false);
    }
  };

  const handleAcceptJoinRequest = async (requestId) => {
    const rid = String(requestId ?? '').trim();
    if (!orgId || !rid) {
      return;
    }
    const norm = (x) => String(x ?? '').toLowerCase();
    setJoinRequestBusyId(rid);
    setPendingJoinRequests((prev) => prev.filter(
      (row) => norm(/** @type {{ id?: string, Id?: string }} */ (row).id ?? /** @type {{ Id?: string }} */ (row).Id) !== norm(rid),
    ));
    try {
      await acceptPartnerJoinRequest(orgId, rid);
      toast.success(t('toasts.joinRequestApproved'));
      dispatchRealtime(REALTIME.notifications.SYNC);
      bumpPartnerMembersCount(1);
      await loadPartner();
      await refreshFeedAndMembers();
      await loadPendingJoinRequests();
    } catch (e) {
      const msg = String(e?.message ?? '');
      await loadPendingJoinRequests();
      if (!/no longer pending/i.test(msg)) {
        toast.error(msg || t('toasts.couldNotAcceptJoinRequest'));
      }
    } finally {
      setJoinRequestBusyId(null);
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    const rid = String(requestId ?? '').trim();
    if (!orgId || !rid) {
      return;
    }
    const norm = (x) => String(x ?? '').toLowerCase();
    setJoinRequestBusyId(rid);
    setPendingJoinRequests((prev) => prev.filter(
      (row) => norm(/** @type {{ id?: string, Id?: string }} */ (row).id ?? /** @type {{ Id?: string }} */ (row).Id) !== norm(rid),
    ));
    try {
      await rejectPartnerJoinRequest(orgId, rid);
      toast.success(t('toasts.joinRequestDeclined'));
      dispatchRealtime(REALTIME.notifications.SYNC);
      await loadPendingJoinRequests();
    } catch (e) {
      const msg = String(e?.message ?? '');
      await loadPendingJoinRequests();
      if (!/no longer pending/i.test(msg)) {
        toast.error(msg || t('toasts.couldNotDeclineJoinRequest'));
      }
    } finally {
      setJoinRequestBusyId(null);
    }
  };

  const currentUserAvatar = authUser?.avatarUrl ?? '';

  const onPostCreated = (apiPost) => {
    const authUserAsAuthor = authUser
      ? { name: authUser.displayName, handle: authUser.handle, isVerified: authUser.isVerified }
      : { name: '', handle: '', isVerified: false };
    const mapped = mapApiPostToFeedPost(apiPost, {
      useCurrentUserAsAuthor: true,
      currentUserAvatar,
      currentUser: authUserAsAuthor,
    });
    setOrgPosts((prev) => prependUniqueFeedPost(prev, mapped));
  };

  const handleOrgPostDeleted = (postId) => {
    const norm = (x) => String(x ?? '').toLowerCase();
    setOrgPosts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
  };

  const handleOrgPollVoted = (postId, apiPoll) => {
    const mappedPoll = mapApiPollToFeedPoll(apiPoll);
    if (!mappedPoll) {
      return;
    }
    setOrgPosts((prev) =>
      prev.map((p) => (String(p.id) === String(postId) ? { ...p, poll: mappedPoll } : p)),
    );
  };

  const handleOrgPostUpdated = (updatedApiPost) => {
    if (!updatedApiPost) {
      return;
    }
    const authUserAsAuthor = authUser
      ? { name: authUser.displayName, handle: authUser.handle, isVerified: authUser.isVerified }
      : { name: '', handle: '', isVerified: false };
    const mapped = mapApiPostToFeedPost(updatedApiPost, {
      useCurrentUserAsAuthor: true,
      currentUserAvatar,
      currentUser: authUserAsAuthor,
    });
    setOrgPosts((prev) => prev.map((p) => (String(p.id) === String(mapped.id) ? mapped : p)));
    setEditingPost(null);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <LangText path="common.loading_partner"  />
        </div>
      </MainLayout>
    );
  }

  if (loadError) {
    return (
      <MainLayout>
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto text-center py-12">
          <p className="text-destructive">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/partners')}>
            <LangText path="common.back_to_partners"  />
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!partner) {
    return (
      <MainLayout>
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground"><LangText path="common.partner_not_found"  /></h1>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/partners')}>
            <LangText path="common.back_to_partners"  />
          </Button>
        </div>
      </MainLayout>
    );
  }

  const name = String(partner.name ?? '');
  const handle = String(partner.handle ?? '');
  const description = String(partner.description ?? '');
  const industry = String(partner.industry ?? '');
  const category = partner.category
    ? partnerCategoryLabel(partner.category, language)
    : '';
  const partnerLocation = partner.location
    ? locationLabel(partner.location, language)
    : '';
  const logoUrl = String(partner.logoUrl ?? '');
  const coverImageUrl = String(partner.coverImageUrl ?? partner.CoverImageUrl ?? '').trim();
  const rawCoverVariants = partner.coverImageVariantUrls ?? partner.CoverImageVariantUrls;
  const coverImageVariantUrls =
    rawCoverVariants && typeof rawCoverVariants === 'object' && !Array.isArray(rawCoverVariants)
      ? /** @type {Record<string, string>} */ (rawCoverVariants)
      : null;
  const coverImageDisplay = normalizeImageDisplayFromApi(
    partner.coverImageDisplay ?? partner.CoverImageDisplay,
  );
  const membersCount = resolvePartnerMembersCount(
    partner,
    orgMembers.filter((row) => {
      const m = /** @type {{ isBanned?: boolean, IsBanned?: boolean }} */ (row);
      return !(m.isBanned ?? m.IsBanned ?? false);
    }).length,
  );
  const partnerNavSlug = handle || orgId;

  /** Banned members see only the org name and a clear restriction message — no profile media, stats, role, or posts. */
  if (isBanned) {
    return (
      <MainLayout>
        <div className="w-full max-w-2xl mx-auto space-y-8 px-4 sm:px-6 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2"
            onClick={() => navigate('/partners')}
          >
            <ArrowLeft className="w-4 h-4" />
            <LangText path="common.back_to_partners"  />
          </Button>
          <div className="rounded-xl border border-border bg-card p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{name || <LangText path="admin.partner"  />}</h1>
            <p className="text-base font-medium text-destructive">
              <LangText path="common.you_are_banned_from_this_partner"
              />
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              <LangText path="common.you_cannot_view_this_partner_s_profile_posts_followers_or_ot"
              />
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <EditPostModal
        open={Boolean(editingPost)}
        onOpenChange={(open) => !open && setEditingPost(null)}
        post={editingPost}
        onPostUpdated={handleOrgPostUpdated}
      />
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto space-y-8 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => navigate('/partners')}
        >
          <ArrowLeft className="w-4 h-4" />
          <LangText path="common.back_to_partners"  />
        </Button>

        {subId && (
          <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground"><LangText path="common.subnetwork"  />: </span>
            <span className="font-mono">{subId}</span>
          </div>
        )}

        <div
          className={cn(
            'bg-card rounded-xl border overflow-hidden transition-shadow',
            isPremium
              ? 'border-primary/40 shadow-md shadow-primary/10 ring-1 ring-primary/20'
              : 'border-border',
          )}
        >
          <div className="relative aspect-[21/9] min-h-[10rem] max-h-[14rem] w-full overflow-hidden bg-muted sm:min-h-[11rem]">
            {coverImageUrl ? (
              <FramedImage
                src={coverImageUrl}
                variantUrls={coverImageVariantUrls}
                imageDisplay={coverImageDisplay}
                alt=""
                className="absolute inset-0 h-full w-full"
                frameClassName="absolute inset-0 h-full w-full"
                frameAspectRatio={COVER_BANNER_ASPECT_RATIO}
                sizes="(max-width: 1280px) 100vw, 1152px"
              />
            ) : (
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-r',
                  isPremium
                    ? 'from-primary/30 via-primary/15 to-accent/25'
                    : 'from-primary/20 via-primary/10 to-accent/20',
                )}
              />
            )}
          </div>

          <div className="relative z-10 -mt-8 rounded-t-2xl bg-card px-6 pb-6 pt-4 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.12)] dark:shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
              <Avatar className="w-24 h-24 rounded-xl border-4 border-card shadow-lg shrink-0 -mt-14 self-center lg:self-start lg:-mt-20">
                <AvatarImage src={logoUrl || undefined} alt={name} className="object-cover" />
                <AvatarFallback className="rounded-xl text-2xl">{name.slice(0, 2)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                      {partner.isVerified && (
                        <BadgeCheck className="w-6 h-6 text-primary fill-primary/20 shrink-0" />
                      )}
                      {isPremium && (
                        <span className="partner-premium-badge gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-600" />
                          <LangText path="partner.premiumPartner"  />
                        </span>
                      )}
                      {viewerIsPlatformAdmin && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          <LangText path="common.platform_admin"  />
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">@{handle}</p>
                    {isBanned && (
                      <p className="text-sm font-medium text-destructive">
                        <LangText path="common.you_are_banned_or_restricted_from_this_partner"
                        />
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 xl:shrink-0 w-full xl:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      {canAssignRoles && partnerNavSlug ? (
                        <Button
                          asChild
                          className="rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground gap-2"
                        >
                          <Link to={partnerManagePath(partnerNavSlug)}>
                            <Settings className="w-4 h-4" />
                            <LangText path="common.manage"  />
                          </Link>
                        </Button>
                      ) : null}
                      {canManage && partnerNavSlug ? (
                        <Button variant="outline" className="rounded-lg border-[hsl(var(--heading))] text-[hsl(var(--heading))]" asChild>
                          <Link to={partnerInvitePath(partnerNavSlug)} className="gap-2 inline-flex items-center">
                            <UserPlus className="w-4 h-4" />
                            <LangText path="common.invite"  />
                          </Link>
                        </Button>
                      ) : null}
                      {!isMember && pendingInvite && !isBanned ? (
                        <div ref={inviteHighlightRef} className="flex flex-wrap gap-2 items-center">
                          <Button
                            className="rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground"
                            onClick={() => void handleAcceptInvite()}
                            disabled={inviteBusy || !pendingInviteId}
                          >
                            {inviteBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LangText path="common.accept"  />}
                          </Button>
                          <Button variant="outline" onClick={() => void handleDeclineInvite()} disabled={inviteBusy || !pendingInviteId}>
                            {inviteBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LangText path="common.decline"  />}
                          </Button>
                        </div>
                      ) : null}
                      {!isMember && !pendingInvite && !hasPendingJoinRequest && !isBanned ? (
                        <Button variant="secondary" onClick={handleJoin} disabled={joinBusy || isBanned}>
                          {joinBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LangText path="common.request_to_join"  />}
                        </Button>
                      ) : null}
                      {!isMember && hasPendingJoinRequest && !pendingInvite ? (
                        <Button variant="secondary" disabled className="opacity-80">
                          <LangText path="common.join_request_pending"  />
                        </Button>
                      ) : null}
                      {isMember && showLeave ? (
                        <Button variant="outline" onClick={handleLeave} disabled={joinBusy} className="gap-2">
                          {joinBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          <LangText path="common.leave"  />
                        </Button>
                      ) : null}
                    </div>
                    <div className="text-sm text-foreground sm:text-right xl:text-right">
                      {canManage && partnerNavSlug ? (
                        <Link
                          to={partnerManagePath(partnerNavSlug)}
                          className="inline-flex items-baseline gap-1 rounded-md hover:bg-muted/60 px-1.5 py-0.5 -mr-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <span className="font-semibold tabular-nums">{membersCount.toLocaleString()}</span>
                          {' '}
                          <span className="text-muted-foreground underline-offset-2 hover:underline">
                            <LangText path="partners.members"  />
                          </span>
                        </Link>
                      ) : (
                        <>
                          <span className="font-semibold tabular-nums">{membersCount.toLocaleString()}</span>
                          {' '}
                          <span className="text-muted-foreground"><LangText path="partners.members"  /></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {description ? <p className="text-foreground leading-relaxed max-w-3xl">{description}</p> : null}

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {category ? (
                    <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 font-medium text-foreground/90">
                      {category}
                    </span>
                  ) : null}
                  {industry ? <Badge variant="secondary">{industry}</Badge> : null}
                  {partnerLocation ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {partnerLocation}
                    </span>
                  ) : null}
                  {myRoleStr ? (
                    <span className="text-muted-foreground">
                      <LangText path="common.your_role"  />{' '}
                      <span className="font-medium text-foreground">{myRoleStr}</span>
                    </span>
                  ) : null}
                </div>

              </div>
            </div>
          </div>
        </div>

        {canManage && pendingJoinRequests.length > 0 ? (
          <div className="space-y-3">
            {pendingJoinRequests.map((row) => {
              const jr = /** @type {{ id?: string, Id?: string, requesterDisplayName?: string, RequesterDisplayName?: string, requesterHandle?: string, RequesterHandle?: string }} */ (row);
              const requestId = String(jr.id ?? jr.Id ?? '');
              const requesterName = String(
                jr.requesterDisplayName ?? jr.RequesterDisplayName ?? jr.requesterHandle ?? jr.RequesterHandle ?? 'Someone',
              );
              const busy = joinRequestBusyId && requestId.toLowerCase() === joinRequestBusyId.toLowerCase();
              return (
                <div
                  key={requestId}
                  id={requestId ? `join-request-${requestId}` : undefined}
                  className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{requesterName}</span>
                    {' '}
                    <LangText path="common.requested_to_join_this_partner"  />
                  </p>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      className="rounded-lg bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground"
                      onClick={() => void handleAcceptJoinRequest(requestId)}
                      disabled={Boolean(joinRequestBusyId)}
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LangText path="common.accept"  />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleRejectJoinRequest(requestId)}
                      disabled={Boolean(joinRequestBusyId)}
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LangText path="common.decline"  />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            <LangText path="common.latest_posts"  />
          </h2>
          {isBanned ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
            >
              <LangText path="common.your_access_to_this_partner_is_restricted_you_cannot_post_jo"
              />
            </div>
          ) : canPost && orgId ? (
            <CreatePost organizationId={orgId} onPostCreated={onPostCreated} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
              <LangText path="common.members_can_post_here"  />
              <p className="text-xs mt-2 opacity-90">
                <LangText path="common.you_can_still_like_comment_repost_bookmark_and_share_posts_w"
                />
              </p>
            </div>
          )}
          {postsLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <LangText path="explore.loading_posts_2"  />
            </div>
          )}
          {!postsLoading && orgPosts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {isBanned ? (
                <LangText path="common.posts_from_this_partner_are_not_shown_while_your_access_is_r"
                />
              ) : (
                <LangText path="common.no_posts_yet"  />
              )}
            </p>
          )}
          <div className="space-y-4">
            {!isBanned &&
              orgPosts.map((post) => (
                <PostCard
                  key={String(post.id ?? post.Id)}
                  post={post}
                  partnerFeedContext={{
                    organizationId: orgId,
                    viewerUserId: authUser?.userId,
                    viewerPartnerRole: myRoleStr,
                  }}
                  onEdit={setEditingPost}
                  onDeleted={handleOrgPostDeleted}
                  onPollVoted={handleOrgPollVoted}
                />
              ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default OrgDetail;
