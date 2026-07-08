import { BadgeCheck, Star, MapPin, Crown, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, Badge, Button } from '@imriva/framework';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { FramedImage } from '@/components/media/FramedImage';
import { normalizeImageDisplayFromApi } from '@/lib/imageCropMetadata';
import { COVER_BANNER_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { useLanguage } from '@/contexts/LanguageContext';
import { locationLabel, partnerCategoryLabel, partnerTierLabel } from '@/lib/displayLabels';
import { useT } from '@/i18n';
import { partnerPath } from '@/lib/appRoutes';
import { joinPartner } from '@/services/partnerService';
import { resolvePartnerMembersCount } from '@/lib/partnerMappers';
import { toast } from 'sonner';
import { useState } from 'react';

/** @param {Record<string, unknown>} partner */
function getPartnerCoverUrl(partner) {
  const u = partner.coverImageUrl ?? partner.CoverImageUrl;
  return typeof u === 'string' && u.trim() ? u.trim() : '';
}

/** @param {Record<string, unknown>} partner */
function getPartnerCoverVariantUrls(partner) {
  const v = partner.coverImageVariantUrls ?? partner.CoverImageVariantUrls;
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return null;
  }
  return /** @type {Record<string, string>} */ (v);
}

/** @param {Record<string, unknown>} partner */
function getPartnerCoverImageDisplay(partner) {
  return normalizeImageDisplayFromApi(partner.coverImageDisplay ?? partner.CoverImageDisplay);
}

/**
 * Partner card: default tile grid, compact row, or discovery grid (mock-aligned).
 */
export function PartnerCard({ partner, variant = 'tile' }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const partnerTier = partner.tier ?? partner.Tier;
  const isPremiumPartner = partnerTier === 'Premium';
  const showPremiumAccent = isPremiumPartner && variant !== 'discovery';
  const tierLabel = showPremiumAccent ? partnerTierLabel('Premium', language) : '';
  const slug = partner.handle || partner.id;
  const orgId = String(partner.id ?? partner.Id ?? '');
  const name = String(partner.name ?? '');
  const handle = String(partner.handle ?? '');
  const [joinBusy, setJoinBusy] = useState(false);
  const isMember = partner.isMember === true || partner.IsMember === true;
  const isBanned = partner.isBanned === true || partner.IsBanned === true;
  const myRole = String(partner.myRole ?? partner.MyRole ?? '');
  const coverUrl = getPartnerCoverUrl(partner);
  const coverVariantUrls = getPartnerCoverVariantUrls(partner);
  const coverImageDisplay = getPartnerCoverImageDisplay(partner);
  const partnerCoverSizes = '(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 560px';
  const logoSrc = partner.logoUrl || partner.LogoUrl || partner.logo;

  /** No cover, logo, followers, role, or description — name + ban copy only. */
  if (isBanned) {
    const openBanned = (e) => {
      if (e?.target?.closest?.('button')) {
        return;
      }
      navigate(partnerPath(slug));
    };
    if (variant === 'discovery') {
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={openBanned}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openBanned(e);
            }
          }}
          className={cn(
            'rounded-xl border border-destructive/30 bg-card p-5 sm:p-6 transition-all cursor-pointer text-left',
            'hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2',
          )}
        >
          <p className="font-bold text-foreground text-lg leading-tight">{name}</p>
          <p className="text-sm font-medium text-destructive mt-3">
            <LangText path="partners.you_are_banned_details_are_hidden"  />
          </p>
        </div>
      );
    }
    if (variant === 'tile') {
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={openBanned}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openBanned(e);
            }
          }}
          className={cn(
            'rounded-xl border border-destructive/30 bg-card min-h-[120px] flex flex-col items-center justify-center px-4 py-6 text-center cursor-pointer transition-all',
            'hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-2',
          )}
        >
          <span className="font-semibold text-foreground truncate max-w-full">{name}</span>
          <span className="text-xs text-destructive font-medium mt-2">
            <LangText path="partners.banned_no_details"  />
          </span>
        </div>
      );
    }
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openBanned}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openBanned(e);
          }
        }}
        className="flex items-start gap-3 p-3 rounded-lg border border-destructive/25 bg-card cursor-pointer hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-sm text-foreground truncate">{name}</p>
          <p className="text-xs text-destructive mt-1">
            <LangText path="partners.banned_details_hidden"  />
          </p>
        </div>
      </div>
    );
  }

  const handleOpen = (e) => {
    if (e.target.closest('button')) {
      return;
    }
    navigate(partnerPath(slug));
  };

  const handleJoinClick = async (e) => {
    e.stopPropagation();
    if (isBanned) {
      toast.error(
        <LangText path="partners.your_access_to_this_partner_is_restricted_you_cannot_join_ag"
        />,
      );
      navigate(partnerPath(slug));
      return;
    }
    if (isMember) {
      navigate(partnerPath(slug));
      return;
    }
    if (!orgId) {
      navigate(partnerPath(slug));
      return;
    }
    setJoinBusy(true);
    try {
      await joinPartner(orgId);
      toast.success(t('toasts.joinRequestSent'));
      navigate(partnerPath(slug));
    } catch (err) {
      toast.error(err?.message || t('toasts.couldNotJoin'));
      navigate(partnerPath(slug));
    } finally {
      setJoinBusy(false);
    }
  };

  if (variant === 'discovery') {
    const membersCount = resolvePartnerMembersCount(partner, 0);
    const description = String(partner.description ?? '').trim();
    const categoryRaw = String(partner.category ?? '').trim();
    const category = categoryRaw ? partnerCategoryLabel(categoryRaw, language) : '';
    const locationDisplay = partner.location
      ? locationLabel(String(partner.location), language)
      : '';

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen(e);
          }
        }}
        className={cn(
          'rounded-xl border overflow-hidden transition-all cursor-pointer text-left flex flex-col gap-0',
          'hover:shadow-md hover:border-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          showPremiumAccent ? 'bg-primary/[0.03] border-primary/25' : 'bg-card border-border',
        )}
      >
        <div className="relative aspect-[2.2/1] w-full shrink-0 overflow-hidden bg-muted sm:aspect-[2.35/1]">
          {coverUrl ? (
            <FramedImage
              src={coverUrl}
              variantUrls={coverVariantUrls}
              imageDisplay={coverImageDisplay}
              alt=""
              className="absolute inset-0 h-full w-full"
              frameClassName="absolute inset-0 h-full w-full"
              frameAspectRatio={COVER_BANNER_ASPECT_RATIO}
              sizes={partnerCoverSizes}
            />
          ) : (
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br',
                showPremiumAccent
                  ? 'from-primary/35 via-primary/15 to-accent/30'
                  : 'from-primary/25 via-primary/10 to-accent/25',
              )}
            />
          )}
        </div>

        <div className="relative z-10 -mt-8 rounded-t-xl bg-card p-4 pt-3 shadow-[0_-10px_32px_-14px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_32px_-14px_rgba(0,0,0,0.35)] flex flex-col gap-3 flex-1 min-h-[120px]">
          <div className="flex gap-3">
            <Avatar className="w-16 h-16 rounded-xl flex-shrink-0 ring-2 ring-card border border-border shadow-sm">
              <AvatarImage src={logoSrc} alt={name} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-muted text-lg font-medium">
                {name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-foreground leading-tight">{name}</span>
                    {partner.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />
                    )}
                    {tierLabel ? (
                      <span className="partner-premium-badge text-[10px] px-1.5 py-0 gap-0.5">
                        <Crown className="w-3 h-3 text-amber-600" />
                        {tierLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">@{handle}</div>
                </div>
                {isBanned ? (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center rounded-lg h-8 px-3 text-xs font-medium border border-destructive/40 bg-destructive/10 text-destructive">
                      <LangText path="partners.access_restricted"  />
                    </span>
                  </div>
                ) : isMember ? (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center rounded-lg h-8 px-3 text-xs font-medium border border-border bg-muted/40 text-muted-foreground">
                      {myRole === 'Admin' ? (
                        <LangText path="partners.admin"  />
                      ) : myRole === 'Moderator' ? (
                        <LangText path="partners.moderator"  />
                      ) : (
                        <LangText path="partners.joined"  />
                      )}
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant={showPremiumAccent ? 'default' : 'outline'}
                    className={cn(
                      'shrink-0 rounded-lg h-8',
                      showPremiumAccent && 'bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90',
                    )}
                    disabled={joinBusy}
                    onClick={handleJoinClick}
                  >
                    {joinBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LangText path="partners.join"  />}
                  </Button>
                )}
              </div>
            </div>
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{description}</p>
          ) : (
            <p className="text-sm text-muted-foreground/70 line-clamp-2 italic">
              <LangText path="partners.open_to_see_details"  />
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {category ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-foreground/80">{category}</span>
            ) : null}
            {locationDisplay ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {locationDisplay}
              </span>
            ) : null}
          </div>
          <div className="text-sm font-semibold text-foreground pt-1 border-t border-border/80">
            {membersCount.toLocaleString()}{' '}
            <span className="font-normal text-muted-foreground"><LangText path="partners.members"  /></span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'tile') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(partnerPath(slug));
          }
        }}
        className={cn(
          'rounded-xl border overflow-hidden transition-all cursor-pointer flex flex-col items-center text-center min-h-[160px] justify-between',
          'hover:shadow-md hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isPremiumPartner
            ? 'bg-primary/5 border-primary/30 dark:bg-primary/10'
            : 'bg-card border-border hover:bg-accent/30',
        )}
      >
        <div className="relative aspect-[2.35/1] w-full shrink-0 overflow-hidden bg-muted">
          {coverUrl ? (
            <FramedImage
              src={coverUrl}
              variantUrls={coverVariantUrls}
              imageDisplay={coverImageDisplay}
              alt=""
              className="absolute inset-0 h-full w-full"
              frameClassName="absolute inset-0 h-full w-full"
              frameAspectRatio={COVER_BANNER_ASPECT_RATIO}
              sizes={partnerCoverSizes}
            />
          ) : (
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br',
                isPremiumPartner
                  ? 'from-primary/30 via-primary/12 to-accent/25'
                  : 'from-primary/22 via-primary/8 to-accent/20',
              )}
            />
          )}
        </div>
        <div className="relative z-10 -mt-7 flex flex-col items-center gap-2 w-full rounded-t-xl bg-card px-4 pb-4 pt-2 shadow-[0_-8px_28px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_28px_-12px_rgba(0,0,0,0.35)] flex-1">
          <Avatar className="w-14 h-14 rounded-xl flex-shrink-0 ring-2 ring-card border border-border shadow-sm">
            <AvatarImage src={logoSrc} alt={partner.name} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-muted text-lg font-medium">
              {partner.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span className="font-semibold text-foreground truncate max-w-full">{partner.name}</span>
              {partner.isVerified && <BadgeCheck className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />}
            </div>
            {isPremiumPartner && tierLabel ? (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-0.5 w-fit mt-0.5">
                <Star className="w-3 h-3 fill-current" />
                {tierLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(partnerPath(slug));
        }
      }}
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isPremiumPartner && 'bg-primary/5',
      )}
    >
      <Avatar className="w-10 h-10 rounded-lg flex-shrink-0">
        <AvatarImage src={logoSrc} alt={partner.name} className="object-cover" />
        <AvatarFallback className="rounded-lg">{partner.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium text-sm text-foreground truncate">{partner.name}</p>
        <p className="text-xs text-muted-foreground">
          {resolvePartnerMembersCount(partner, 0).toLocaleString()}{' '}
          <LangText path="partners.membersLower"  />
          {isPremiumPartner && tierLabel ? (
            <>
              {' · '}
              <span className="text-primary font-medium">{tierLabel}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
