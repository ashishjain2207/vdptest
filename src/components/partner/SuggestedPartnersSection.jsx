import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@imriva/framework';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { partnerPath } from '@/lib/appRoutes';
import { joinPartner } from '@/services/partnerService';
import { resolvePartnerMembersCount } from '@/lib/partnerMappers';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

function SuggestedPartnerRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-[5.5rem] rounded-lg shrink-0" />
    </div>
  );
}

/**
 * Dashboard sidebar: suggested partners as rows with Join / Joined (membership).
 */
export function SuggestedPartnersSection({
  partners = [],
  loading = false,
  onMembershipChange,
}) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const t = useT();
  const [busyId, setBusyId] = useState(null);

  const openPartner = (slug) => {
    navigate(partnerPath(slug));
  };

  const handleJoin = async (e, partner) => {
    e.stopPropagation();
    const orgId = String(partner.id ?? partner.Id ?? '');
    const slug = partner.handle || partner.Handle || orgId;
    const isBanned = partner.isBanned === true || partner.IsBanned === true;
    if (isBanned) {
      toast.error(
        <LangText path="partners.your_access_to_this_partner_is_restricted"
        />,
      );
      openPartner(slug);
      return;
    }
    const isMember = partner.isMember === true || partner.IsMember === true;
    if (isMember) {
      openPartner(slug);
      return;
    }
    if (!authUser) {
      navigate('/login', { state: { from: partnerPath(slug) } });
      return;
    }
    if (!orgId) {
      openPartner(slug);
      return;
    }
    setBusyId(orgId);
    try {
      await joinPartner(orgId);
      toast.success(t('toasts.joinRequestSent'));
      onMembershipChange?.(orgId);
      openPartner(slug);
    } catch (err) {
      toast.error(err?.message || t('toasts.couldNotJoin'));
      openPartner(slug);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-primary shrink-0" />
        <h2 className="font-semibold text-foreground">
          <LangText path="feed.recommendedPartners"  />
        </h2>
      </div>

      <div className="divide-y divide-border/80">
        {loading &&
          [1, 2, 3].map((i) => (
            <div key={i} className="py-2.5 first:pt-0">
              <SuggestedPartnerRowSkeleton />
            </div>
          ))}
        {!loading && partners.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            <LangText path="partners.no_partners_to_show_yet"  />
          </p>
        )}
        {!loading &&
          partners.map((partner) => {
            const slug = partner.handle || partner.Handle || partner.id;
            const name = String(partner.name ?? partner.Name ?? '');
            const isBanned = partner.isBanned === true || partner.IsBanned === true;
            const isMember = partner.isMember === true || partner.IsMember === true;
            const members = resolvePartnerMembersCount(partner, 0);
            const orgId = String(partner.id ?? partner.Id ?? '');
            const busy = busyId === orgId;

            if (isBanned) {
              return (
                <div
                  key={orgId || slug}
                  className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg text-left border border-destructive/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate text-sm leading-tight">{name}</p>
                    <p className="text-xs text-destructive mt-0.5">
                      <LangText path="partners.banned_details_hidden"  />
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={orgId || slug}
                role="button"
                tabIndex={0}
                onClick={() => openPartner(slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPartner(slug);
                  }
                }}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-accent/40 -mx-2 px-2 rounded-lg transition-colors text-left"
              >
                <Avatar className="h-10 w-10 rounded-lg shrink-0 border border-border">
                  <AvatarImage src={partner.logoUrl || partner.LogoUrl || partner.logo} alt={name} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-muted text-sm font-medium">{name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate text-sm leading-tight">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {members.toLocaleString()}{' '}
                    <LangText path="partners.membersLower"  />
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-lg h-8 px-3 text-primary border-border bg-background hover:bg-accent/50 hover:text-primary"
                  disabled={busy}
                  onClick={(e) => handleJoin(e, partner)}
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isMember ? (
                    <LangText path="partners.joined"  />
                  ) : (
                    <LangText path="partners.join"  />
                  )}
                </Button>
              </div>
            );
          })}
      </div>

      <button
        type="button"
        className="mt-3 text-sm text-primary hover:underline flex items-center gap-1"
        onClick={() => navigate('/partners')}
      >
        <LangText path="feed.discoverMorePartners"  /> <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
