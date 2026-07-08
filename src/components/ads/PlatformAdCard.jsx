import { useEffect, useRef, useLayoutEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  localizeAdBody,
  localizeAdCta,
  localizeAdTitle,
  localizeAdvertiserName,
} from '@/lib/adDisplay';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { FramedImage } from '@/components/media/FramedImage';
import { normalizeImageDisplayFromApi } from '@/lib/imageCropMetadata';
import { FEED_WIDE_ASPECT_RATIO, SIDEBAR_AD_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { getAdAnalyticsSessionId } from '@/lib/adAnalyticsSession';
import { recordPlatformAdClick, recordPlatformAdImpression } from '@/services/platformAdvertisementService';

function readText(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== null && value !== undefined) {
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
  }
  return '';
}

/**
 * Outbound ad targets must be absolute http/https URLs before they are rendered as hrefs.
 * @param {unknown} raw
 * @returns {string}
 */
export function sanitizeAdTargetUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) {
    return '';
  }
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return '';
    }
    return u.toString();
  } catch {
    return '';
  }
}

function formatAdvertiserFromUrl(targetUrl) {
  if (!targetUrl) {
    return '';
  }
  try {
    const hostname = new URL(targetUrl).hostname.replace(/^www\./i, '');
    const root = hostname.split('.')[0] || hostname;
    return root
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    return '';
  }
}

function formatTargetHost(targetUrl) {
  if (!targetUrl) {
    return '';
  }
  try {
    return new URL(targetUrl).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/** @param {string} name */
function advertiserInitials(name) {
  const s = String(name || '').trim();
  if (!s) {
    return '?';
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

const IMPRESSION_VISIBLE_RATIO = 0.5;
const IMPRESSION_MIN_VISIBLE_MS = 1000;

/**
 * @param {string} adId
 * @param {React.RefObject<HTMLElement | null>} rootRef
 */
function useViewableImpression(adId, rootRef) {
  const impressionSentRef = useRef(/** @type {string | null} */ (null));
  const prevAdIdRef = useRef(adId);
  /** @type {React.MutableRefObject<number | null>} */
  const visibleSinceRef = useRef(null);
  /** @type {React.MutableRefObject<number>} */
  const lastRatioRef = useRef(0);

  useEffect(() => {
    if (prevAdIdRef.current !== adId) {
      prevAdIdRef.current = adId;
      impressionSentRef.current = null;
      visibleSinceRef.current = null;
      lastRatioRef.current = 0;
    }
  }, [adId]);

  useLayoutEffect(() => {
    if (!adId) {
      return undefined;
    }
    if (impressionSentRef.current === adId) {
      return undefined;
    }
    const el = rootRef.current;
    if (!el) {
      return undefined;
    }
    let timerId = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
    const clearTimer = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (impressionSentRef.current === adId) {
          return;
        }
        const entry = entries[0];
        if (!entry) {
          return;
        }
        const ratio = entry.intersectionRatio;
        lastRatioRef.current = ratio;
        const visible = entry.isIntersecting && ratio >= IMPRESSION_VISIBLE_RATIO;
        if (visible) {
          if (visibleSinceRef.current === null) {
            visibleSinceRef.current = performance.now();
          }
          clearTimer();
          timerId = window.setTimeout(() => {
            if (impressionSentRef.current === adId) {
              return;
            }
            const dwellMs =
              visibleSinceRef.current !== null
                ? Math.round(performance.now() - visibleSinceRef.current)
                : IMPRESSION_MIN_VISIBLE_MS;
            const pct = Math.min(
              100,
              Math.max(50, Math.round(Math.max(lastRatioRef.current, IMPRESSION_VISIBLE_RATIO) * 100)),
            );
            const renderEventId =
              typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
            impressionSentRef.current = adId;
            recordPlatformAdImpression(adId, {
              userSessionId: getAdAnalyticsSessionId(),
              renderEventId,
              viewablePixelsPct: pct,
              timeInViewportMs: Math.max(IMPRESSION_MIN_VISIBLE_MS, dwellMs),
            });
            observer.disconnect();
          }, IMPRESSION_MIN_VISIBLE_MS);
        } else {
          visibleSinceRef.current = null;
          clearTimer();
        }
      },
      { root: null, rootMargin: '0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    observer.observe(el);
    return () => {
      clearTimer();
      observer.disconnect();
    };
  }, [adId, rootRef]);
}

/**
 * Dashboard platform ads — post-like layout: avatar column + content column (text/media never under icon).
 *
 * @param {{ ad: Record<string, unknown>, variant?: 'feed' | 'sidebar', className?: string }} props
 */
export function PlatformAdCard({ ad, variant = 'feed', className = '' }) {
  const { language } = useLanguage();
  const t = useT();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const adId = ad ? String(ad.id ?? ad.Id ?? '').trim() : '';
  const impressionRootRef = useRef(/** @type {HTMLElement | null} */ (null));
  useViewableImpression(adId, impressionRootRef);

  if (!ad) {
    return null;
  }

  const onOutbound = () => {
    if (adId) {
      recordPlatformAdClick(adId);
    }
  };

  const title = localizeAdTitle(readText(ad, 'title', 'Title'), lang);
  const body = localizeAdBody(readText(ad, 'body', 'Body', 'description', 'Description'), lang);
  const mediaUrl = readText(ad, 'imageUrl', 'ImageUrl', 'mediaUrl', 'MediaUrl');
  const targetUrl = sanitizeAdTargetUrl(readText(ad, 'targetUrl', 'TargetUrl'));
  const ctaRaw = readText(ad, 'ctaText', 'CtaText', 'callToAction', 'CallToAction', 'linkText', 'LinkText');
  const ctaText = localizeAdCta(ctaRaw, lang) || t('ads.learnMore');
  const explicitAdvertiserName = localizeAdvertiserName(
    readText(
      ad,
      'advertiserName',
      'AdvertiserName',
      'partnerName',
      'PartnerName',
      'organizationName',
      'OrganizationName',
      'companyName',
      'CompanyName',
      'ownerName',
      'OwnerName',
    ),
  );
  const logoUrl = readText(
    ad,
    'advertiserLogoUrl',
    'AdvertiserLogoUrl',
    'logoUrl',
    'LogoUrl',
    'brandLogoUrl',
    'BrandLogoUrl',
  );
  const rawImageVariants = ad.imageVariantUrls ?? ad.ImageVariantUrls;
  const imageVariantUrls =
    rawImageVariants && typeof rawImageVariants === 'object' && !Array.isArray(rawImageVariants)
      ? /** @type {Record<string, string>} */ (rawImageVariants)
      : null;
  const rawLogoVariants = ad.advertiserLogoVariantUrls ?? ad.AdvertiserLogoVariantUrls;
  const advertiserLogoVariantUrls =
    rawLogoVariants && typeof rawLogoVariants === 'object' && !Array.isArray(rawLogoVariants)
      ? /** @type {Record<string, string>} */ (rawLogoVariants)
      : null;
  const imageDisplay = normalizeImageDisplayFromApi(ad.imageDisplay ?? ad.ImageDisplay);
  const advertiserLogoImageDisplay = normalizeImageDisplayFromApi(
    ad.advertiserLogoImageDisplay ?? ad.AdvertiserLogoImageDisplay,
  );
  const advertiserName =
    explicitAdvertiserName
    || localizeAdvertiserName(formatAdvertiserFromUrl(targetUrl))
    || (lang === 'DE' ? 'Anzeige' : 'Sponsored');
  const targetHost = formatTargetHost(targetUrl);
  const initialsSource = advertiserName || targetHost || '';
  const isVideo =
    Boolean(ad.isVideo ?? ad.IsVideo) || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(mediaUrl);
  const isSidebar = variant === 'sidebar';
  const ariaAd = ['Advertising', title].filter(Boolean).join(': ');

  const shell = cn(
    'overflow-hidden rounded-xl border border-red-300/55 bg-card text-left text-foreground shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-red-900/45',
    className,
  );

  const pad = isSidebar ? 'p-3.5' : 'p-4 sm:p-5';
  const gapMain = isSidebar ? 'gap-2.5' : 'gap-3';
  const avatarBox = isSidebar
    ? 'h-9 w-9 shrink-0 rounded-full border border-border bg-muted text-[10px]'
    : 'h-11 w-11 shrink-0 rounded-lg border border-border bg-muted text-xs';

  const AdvertiserAvatar = () => (
    <div className={cn('flex items-center justify-center overflow-hidden font-semibold text-foreground', avatarBox)}>
      {logoUrl ? (
        <FramedImage
          src={logoUrl}
          variantUrls={advertiserLogoVariantUrls}
          imageDisplay={advertiserLogoImageDisplay}
          alt=""
          className="h-full w-full"
          isCircular={isSidebar}
          sizes={isSidebar ? '40px' : '48px'}
        />
      ) : (
        <span className="select-none">{advertiserInitials(initialsSource)}</span>
      )}
    </div>
  );

  const sponsoredLabel = (
    <span
      className={cn(
        'shrink-0 rounded-full border border-red-400/50 bg-background/80 px-2 py-0.5 font-semibold uppercase tracking-[0.12em] text-red-700 dark:border-red-500/40 dark:bg-card dark:text-red-400',
        isSidebar ? 'text-[9px]' : 'text-[10px]',
      )}
    >
      <LangText path="ads.sponsored"  />
    </span>
  );

  const titleClass = isSidebar
    ? 'text-[0.94rem] font-semibold leading-snug tracking-tight text-foreground line-clamp-2'
    : 'text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-3 sm:text-[1.05rem]';
  const descClass = isSidebar
    ? 'text-xs leading-relaxed text-muted-foreground line-clamp-3'
    : 'text-sm leading-relaxed text-muted-foreground line-clamp-4';

  return (
    <article ref={impressionRootRef} className={shell} role="region" aria-label={ariaAd}>
      <div className={cn('flex', gapMain, pad)}>
        {/* Column 1: logo — same pattern as PostCard avatar */}
        <AdvertiserAvatar />

        {/* Column 2: everything else (never flows under the icon) */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-3.5">
          {/* Top: advertiser line + pill */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {isSidebar ? (
                <span className="truncate text-[0.82rem] font-medium uppercase tracking-[0.04em] text-muted-foreground">{advertiserName}</span>
              ) : (
                <p className="min-w-0 text-[0.84rem] leading-snug text-muted-foreground sm:text-[0.9rem]">
                  <span className="font-medium uppercase tracking-[0.04em]">{advertiserName}</span>
                </p>
              )}
            </div>
            {sponsoredLabel}
          </div>

          {(title || body) && (
            <div className="flex flex-col gap-2">
              {title ? <h3 className={titleClass}>{title}</h3> : null}
              {body ? <p className={descClass}>{body}</p> : null}
            </div>
          )}

          {mediaUrl ? (
            <div
              className={cn(
                'w-full overflow-hidden rounded-xl border border-border/60 bg-muted',
                isSidebar ? 'aspect-[5/3]' : 'aspect-[2.15/1] min-h-[180px] sm:min-h-[220px]',
              )}
            >
              {isVideo ? (
                <video className="h-full w-full object-cover object-center bg-black" src={mediaUrl} controls playsInline preload="metadata" />
              ) : (
                <FramedImage
                  src={mediaUrl}
                  variantUrls={imageVariantUrls}
                  imageDisplay={imageDisplay}
                  alt=""
                  className="h-full w-full"
                  frameClassName="h-full w-full"
                  frameAspectRatio={isSidebar ? SIDEBAR_AD_ASPECT_RATIO : FEED_WIDE_ASPECT_RATIO}
                  sizes={isSidebar ? '(max-width: 400px) 100vw, 320px' : '(max-width: 640px) 100vw, 720px'}
                />
              )}
            </div>
          ) : null}

          {targetUrl ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={onOutbound}
                className="inline-flex items-center gap-1.5 font-medium text-red-600 transition-colors hover:text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 dark:text-red-400 dark:hover:text-red-300"
              >
                <span className={isSidebar ? 'text-sm' : 'text-sm sm:text-[15px]'}>{ctaText}</span>
                <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
