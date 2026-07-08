import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@imriva/framework';
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
import { LangText } from '@/components/ui/LangText';
import { toast } from 'sonner';
import {
  adminListAdvertisements,
  adminPauseAdvertisement,
  adminActivateAdvertisement,
  adminDeleteAdvertisement,
} from '@/services/adminAdvertisementService';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Plus, Loader2, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAdvertisementScheduleStatus,
  scheduleMatchesFilter,
  scheduleBadgeClassName,
  scheduleRowOpacityClassName,
} from '@/lib/adminScheduleStatus';
import { Badge } from '@/components/ui/badge';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { useT } from '@/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCountryOptionLabel } from '@/lib/marketCountryCodes';
import { isDummyAdText, localizeAdTitle } from '@/lib/adDisplay';

/** @param {unknown} p @param {(path: string) => string} tFn */
function placementLabel(p, tFn) {
  const isSidebar =
    p === 'Sidebar' ||
    p === 'sidebar' ||
    (typeof p === 'number' ? p : Number(p)) === 1;
  if (isSidebar) {
    return tFn('admin.placementSidebar');
  }
  return tFn('admin.placementFeed');
}

/** @param {Record<string, unknown>} row */
function isDummyAdminAdRow(row) {
  const title = String(row.title ?? row.Title ?? '');
  return isDummyAdText(title);
}

const thCell = 'px-4 py-3 font-semibold text-foreground whitespace-nowrap';
const tdCell = 'px-4 py-3 align-middle';
/** Table columns: hidden on small screens, shown from breakpoint up */
const colMd = 'hidden md:table-cell';
const colLg = 'hidden lg:table-cell';
const colXl = 'hidden 2xl:table-cell';
/** Inline fallbacks under ad title: only when the matching column is hidden */
const onlyBelowMd = 'md:hidden';
const onlyBelowLg = 'lg:hidden';
const onlyBelowXl = '2xl:hidden';

/** @param {unknown} v */
function formatCompactMetric(v) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) {
    return '—';
  }
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 10_000) {
    return `${(n / 1_000).toFixed(1)}k`;
  }
  if (Number.isInteger(n)) {
    return n.toLocaleString();
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** @param {unknown} p */
function isFeedPlacement(p) {
  if (p === 'Sidebar' || p === 'sidebar') {
    return false;
  }
  const n = typeof p === 'number' ? p : Number(p);
  return n !== 1;
}

/**
 * Rough CTR bands (internal metrics; impressions are viewability-based on dashboard).
 * Feed: social/feed–style bands. Sidebar: display-style bands.
 * @param {unknown} placement
 * @param {number | null} pct
 * @param {(path: string) => string} tFn
 */
function ctrBenchmarkMeta(placement, pct, tFn) {
  if (pct === null || !Number.isFinite(pct)) {
    return null;
  }
  if (isFeedPlacement(placement)) {
    if (pct < 1) {
      return {
        label: tFn('admin.ctrLow'),
        title: tFn('admin.ctrBelowFeed'),
        className: 'text-amber-700 dark:text-amber-400',
      };
    }
    if (pct < 3) {
      return {
        label: tFn('admin.ctrGood'),
        title: tFn('admin.ctrGoodFeed'),
        className: 'text-sky-800 dark:text-sky-300',
      };
    }
    return {
      label: tFn('admin.ctrExcellent'),
      title: tFn('admin.ctrExcellentFeed'),
      className: 'text-emerald-700 dark:text-emerald-400',
    };
  }
  if (pct < 0.5) {
    return {
      label: tFn('admin.ctrLow'),
      title: tFn('admin.ctrBelowSidebar'),
      className: 'text-amber-700 dark:text-amber-400',
    };
  }
  if (pct < 1) {
    return {
      label: tFn('admin.ctrTypical'),
      title: tFn('admin.ctrTypicalSidebar'),
      className: 'text-muted-foreground',
    };
  }
  return {
    label: tFn('admin.ctrStrong'),
    title: tFn('admin.ctrStrongSidebar'),
    className: 'text-emerald-700 dark:text-emerald-400',
  };
}

/** @param {unknown} impressions @param {unknown} clicks */
function ctrPercent(impressions, clicks) {
  const imp = typeof impressions === 'number' ? impressions : Number(impressions);
  const clk = typeof clicks === 'number' ? clicks : Number(clicks);
  if (!Number.isFinite(imp) || imp <= 0 || !Number.isFinite(clk) || clk < 0) {
    return null;
  }
  return (clk / imp) * 100;
}

/** Operational status: 0 Active, 1 Paused (API AdvertisementStatus). */
/** @param {unknown} s */
function isActiveStatus(s) {
  return Number(s) === 0;
}

/** @param {Record<string, unknown>} row */
function isActiveListing(row) {
  const st = row.status ?? row.Status;
  const on = row.isActive ?? row.IsActive;
  return getAdvertisementScheduleStatus(row) !== 'expired' && isActiveStatus(st) && Boolean(on);
}

/**
 * Platform admin: advertisements — active/pause workflow (no approve/reject).
 */
const AdminAdvertisements = () => {
  const { country } = useAdminScopeCountry();
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const t = useT();
  const { language } = useLanguage();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const { showRefreshLoader: loading, endInitialFetch } = useRefreshOnlyFullPageLoader();
  const [query, setQuery] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState(
    /** @type {'all' | 'active' | 'scheduled' | 'expired'} */ ('all'),
  );
  const [busyId, setBusyId] = useState(/** @type {string | null} */ (null));
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null));
  const [deleteTarget, setDeleteTarget] = useState(/** @type {{ id: string, title: string } | null} */ (null));

  const load = useCallback(async () => {
    try {
      const raw = await adminListAdvertisements();
      const rows = Array.isArray(raw) ? raw : [];
      setItems(rows.filter((row) => !isDummyAdminAdRow(row)));
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoadAdvertisements'));
      setItems([]);
    } finally {
      endInitialFetch();
    }
  }, [endInitialFetch]);

  useEffect(() => {
    void load();
  }, [load, country]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items;
    if (q) {
      rows = items.filter((row) => {
        const title = String(row.title ?? row.Title ?? '').toLowerCase();
        const url = String(row.targetUrl ?? '').toLowerCase();
        const advertiser = String(row.advertiserName ?? row.AdvertiserName ?? '').toLowerCase();
        return title.includes(q) || url.includes(q) || advertiser.includes(q);
      });
    }
    if (scheduleFilter !== 'all') {
      rows = rows.filter((row) =>
        scheduleMatchesFilter(getAdvertisementScheduleStatus(row), scheduleFilter),
      );
    }
    return [...rows].sort((a, b) => Number(isActiveListing(b)) - Number(isActiveListing(a)));
  }, [items, query, scheduleFilter]);

  const summary = useMemo(() => {
    const total = items.length;
    const active = items.filter((row) => {
      return isActiveListing(row);
    }).length;
    return { total, active };
  }, [items]);

  const scopeLabel = country
    ? formatCountryOptionLabel(country, lang)
    : null;

  /** @param {string} id @param {'pause' | 'activate'} kind */
  const act = async (id, kind) => {
    setBusyId(id);
    try {
      if (kind === 'pause') {
        await adminPauseAdvertisement(id);
        toast.success(t('toasts.advertisementPaused'));
      } else {
        await adminActivateAdvertisement(id);
        toast.success(t('toasts.advertisementActivated'));
      }
      void load();
    } catch (e) {
      toast.error(e?.message || t('toasts.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const openDeleteDialog = (e, id, title) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget({ id, title: title || id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(id);
    try {
      await adminDeleteAdvertisement(id);
      toast.success(t('toasts.advertisementDeleted'));
      setItems((prev) => prev.filter((row) => String(row.id ?? row.Id ?? '') !== id));
    } catch (err) {
      toast.error(err?.message || t('toasts.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const formatNum = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n)) {
      return '0';
    }
    return n.toLocaleString();
  };

  /** @param {unknown} impressions @param {unknown} clicks */
  const formatCtr = (impressions, clicks) => {
    const pct = ctrPercent(impressions, clicks);
    if (pct === null) {
      return '—';
    }
    return `${pct.toFixed(2)}%`;
  };

  return (
    <div className="w-full max-w-[min(100%,90rem)] mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4" />
              <LangText path="admin.back_to_admin_dashboard"  />
            </Link>
          </Button>
          <h1 className="partner-admin-heading">
            <LangText path="nav.ads"  />
          </h1>
          <p className="text-sm text-muted-foreground">
            <span>{summary.total}</span>
            <LangText path="admin.ads"  />
            <span>{summary.active}</span>
            <LangText path="admin.active"  />
          </p>
          <p className="text-sm text-muted-foreground">
            {scopeLabel ? (
              `${t('admin.showing_data_for')} ${scopeLabel}.`
            ) : (
              <LangText path="admin.showing_data_for_all_markets" />
            )}
          </p>
        </div>
        <Button
          asChild
          className="inline-flex gap-2 shadow-soft bg-primary text-primary-foreground hover:bg-secondary"
        >
          <Link
            to="/admin/ads/create"
            className="inline-flex items-center !text-primary-foreground hover:!text-primary-foreground no-underline hover:no-underline"
          >
            <Plus className="w-4 h-4" />
            <LangText path="admin.add_ad"  />
          </Link>
        </Button>
      </div>

      <ClearableSearchInput
        className="w-full"
        inputClassName="h-11 rounded-xl bg-card border-border shadow-sm"
        placeholder={t('admin.search_ads')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        clearAriaLabel={t('common.clearSearch')}
        dataTestId="admin-advertisements-search"
      />

      <div
        className="flex flex-wrap gap-2 items-center"
        role="group"
        aria-label={t('admin.filterByStatus')}
      >
        <span className="text-xs text-muted-foreground shrink-0">
          <LangText path="admin.status"  />
        </span>
        {(
          /** @type {Array<{ key: 'all' | 'active' | 'scheduled' | 'expired', path: string }>} */ ([
            { key: 'all', path: 'common.all' },
            { key: 'active', path: 'status.active' },
            { key: 'scheduled', path: 'status.planned' },
            { key: 'expired', path: 'status.past' },
          ])
        ).map(({ key, path: labelPath }) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={scheduleFilter === key ? 'default' : 'outline'}
            className={cn(
              'h-8 rounded-full text-xs',
              scheduleFilter === key && 'bg-[hsl(var(--heading))] hover:bg-[hsl(var(--heading))]/90 text-primary-foreground',
            )}
            onClick={() => setScheduleFilter(key)}
          >
            <LangText path={labelPath} />
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <LangText path="common.loading"  />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div
            className="overflow-x-auto overscroll-x-contain"
            tabIndex={0}
            role="region"
            aria-label={t('admin.adsListScrollAria')}
          >
            <table className="w-full table-fixed text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs sm:text-sm">
                  <th className={cn(thCell, 'min-w-[11rem] max-w-[18rem]')}>
                    <LangText path="admin.ad"  />
                  </th>
                  <th className={cn(thCell, colMd, 'min-w-[6.5rem]')}>
                    <LangText path="admin.advertiser"  />
                  </th>
                  <th className={cn(thCell, colLg, 'min-w-[5.25rem]')}>
                    <LangText path="admin.placement"  />
                  </th>
                  <th className={cn(thCell, 'w-[7%]')}>
                    <LangText path="admin.status_2"  />
                  </th>
                  <th
                    className={cn(thCell, 'min-w-[6.25rem]')}
                    title={t('admin.reviewStatusTitle')}
                  >
                    <LangText path="admin.review_status"  />
                  </th>
                  <th
                    className={cn(thCell, colMd, 'min-w-[9rem] text-right')}
                    title={t('admin.impressionsClicksCtrTitle')}
                  >
                    <LangText path="admin.performance"  />
                  </th>
                  <th
                    className={cn(thCell, colXl, 'min-w-[7.5rem] text-right')}
                    title={t('admin.reachFrequencyCpmTitle')}
                  >
                    <LangText path="admin.delivery"  />
                  </th>
                  <th
                    className={cn(
                      thCell,
                      'sticky right-0 z-20 min-w-[6.5rem] text-right bg-muted/40 shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.12)]',
                    )}
                  >
                    <LangText path="admin.actions"  />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const id = String(row.id ?? row.Id ?? '');
                  const title = localizeAdTitle(row.title ?? row.Title, lang);
                  const st = row.status ?? row.Status;
                  const active = Boolean(row.isActive ?? row.IsActive);
                  const scheduleKind = getAdvertisementScheduleStatus(row);
                  const expired = scheduleKind === 'expired';
                  const running = !expired && isActiveStatus(st) && active;
                  const impressions = row.impressionCount ?? row.ImpressionCount ?? 0;
                  const clicks = row.clickCount ?? row.ClickCount ?? 0;
                  const advertiser = String(row.advertiserName ?? row.AdvertiserName ?? '').trim();
                  const pl = row.placement ?? row.Placement;
                  const toggleBusy = busyId === id;
                  const pct = ctrPercent(impressions, clicks);
                  const band = ctrBenchmarkMeta(pl, pct, t);
                  const reach = Number(row.reachDistinctUsers ?? row.ReachDistinctUsers ?? 0);
                  const freqRaw = row.frequency ?? row.Frequency;
                  const freq =
                    typeof freqRaw === 'number' && Number.isFinite(freqRaw)
                      ? freqRaw
                      : freqRaw !== null && freqRaw !== undefined && Number.isFinite(Number(freqRaw))
                        ? Number(freqRaw)
                        : null;
                  const cpmRaw = row.cpm ?? row.Cpm;
                  const placement = placementLabel(pl, t);
                  const listingClassName = expired
                    ? 'border-border bg-muted text-muted-foreground'
                    : running
                      ? 'border-emerald-600/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60'
                      : 'border-amber-600/40 bg-amber-50 text-amber-900 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60';
                  return (
                    <tr
                      key={id}
                      className={cn(
                        'group border-b border-border/80 last:border-0 hover:bg-muted/20 transition-colors',
                        scheduleRowOpacityClassName(scheduleKind),
                      )}
                    >
                      <td className={cn(tdCell, 'font-medium text-foreground')}>
                        <div className="truncate" title={title}>
                          {title}
                        </div>
                        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                          {advertiser ? (
                            <span
                              className={cn('truncate text-xs text-muted-foreground', onlyBelowMd)}
                              title={advertiser}
                            >
                              {advertiser}
                            </span>
                          ) : null}
                          <span
                            className={cn(
                              'inline-flex shrink-0 rounded-full border border-border px-1.5 py-0 text-[10px] font-medium text-muted-foreground',
                              onlyBelowLg,
                            )}
                          >
                            {placement}
                          </span>
                        </div>
                        <p className={cn('mt-1 text-[11px] text-muted-foreground tabular-nums', onlyBelowMd)}>
                          {formatCompactMetric(impressions)}
                          <span className="mx-1" aria-hidden>·</span>
                          {formatCompactMetric(clicks)}
                          <span className="mx-1" aria-hidden>·</span>
                          <span className={band?.className}>{formatCtr(impressions, clicks)}</span>
                        </p>
                        <p className={cn('mt-0.5 text-[11px] text-muted-foreground tabular-nums', onlyBelowXl)}>
                          {t('admin.reachShort')} {formatCompactMetric(reach)}
                          <span className="mx-1" aria-hidden>·</span>
                          {t('admin.freqShort')}{' '}
                          {freq !== null && Number.isFinite(freq) ? freq.toFixed(2) : '—'}
                          <span className="mx-1" aria-hidden>·</span>
                          CPM{' '}
                          {cpmRaw !== null && cpmRaw !== undefined && Number.isFinite(Number(cpmRaw))
                            ? formatCompactMetric(Number(cpmRaw))
                            : '—'}
                        </p>
                      </td>
                      <td className={cn(tdCell, colMd, 'text-muted-foreground')}>
                        <span className="line-clamp-2 break-words text-xs">{advertiser || '—'}</span>
                      </td>
                      <td className={cn(tdCell, colLg)}>
                        <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {placement}
                        </span>
                      </td>
                      <td className={cn(tdCell)}>
                        <Badge
                          variant="outline"
                          className={cn('px-2 py-0 text-[11px] font-medium', scheduleBadgeClassName(scheduleKind))}
                        >
                          {scheduleKind === 'expired' ? (
                            <LangText path="status.past"  />
                          ) : scheduleKind === 'scheduled' ? (
                            <LangText path="status.planned"  />
                          ) : (
                            <LangText path="status.active"  />
                          )}
                        </Badge>
                      </td>
                      <td className={cn(tdCell)}>
                        <button
                          type="button"
                          disabled={toggleBusy || expired}
                          onClick={() => {
                            if (!expired) {
                              void act(id, running ? 'pause' : 'activate');
                            }
                          }}
                          className={cn(
                            'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            'disabled:opacity-70',
                            listingClassName,
                          )}
                          aria-pressed={running}
                          title={
                            expired
                              ? t('admin.expiredAdsCannotActivate')
                              : running
                                ? t('admin.clickToPause')
                                : t('admin.clickToActivate')
                          }
                        >
                          {toggleBusy ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : null}
                          <span className="truncate">
                            {expired ? (
                              <LangText path="status.past"  />
                            ) : running ? (
                              <LangText path="status.approved"  />
                            ) : (
                              <LangText path="status.pending"  />
                            )}
                          </span>
                        </button>
                      </td>
                      <td className={cn(tdCell, colMd, 'text-right')}>
                        <dl className="space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                          <div className="flex justify-end gap-2 tabular-nums">
                            <dt className="sr-only">{t('admin.impressionsAria')}</dt>
                            <dd>
                              <span className="text-foreground/70">{t('admin.impressionsShort')}</span>{' '}
                              {formatCompactMetric(impressions)}
                            </dd>
                          </div>
                          <div className="flex justify-end gap-2 tabular-nums">
                            <dt className="sr-only">{t('admin.clicksShort')}</dt>
                            <dd>
                              <span className="text-foreground/70">{t('admin.clicksShort')}</span>{' '}
                              {formatCompactMetric(clicks)}
                            </dd>
                          </div>
                          <div
                            className="flex justify-end gap-2 tabular-nums"
                            title={band?.title ?? t('admin.clickThroughRate')}
                          >
                            <dt className="sr-only">CTR</dt>
                            <dd className={cn(band ? band.className : 'text-foreground')}>
                              <span className="text-foreground/70">CTR</span> {formatCtr(impressions, clicks)}
                            </dd>
                          </div>
                        </dl>
                      </td>
                      <td className={cn(tdCell, colXl, 'text-right')}>
                        <dl className="space-y-0.5 text-[11px] leading-snug text-muted-foreground ml-auto w-fit">
                          <div className="flex justify-end gap-2 tabular-nums">
                            <dt className="text-foreground/70">{t('admin.reachShort')}</dt>
                            <dd>{formatCompactMetric(reach)}</dd>
                          </div>
                          <div className="flex justify-end gap-2 tabular-nums">
                            <dt className="text-foreground/70">{t('admin.freqShort')}</dt>
                            <dd>{freq !== null && Number.isFinite(freq) ? freq.toFixed(2) : '—'}</dd>
                          </div>
                          <div className="flex justify-end gap-2 tabular-nums">
                            <dt className="text-foreground/70">CPM</dt>
                            <dd
                              title={
                                cpmRaw !== null && cpmRaw !== undefined && Number.isFinite(Number(cpmRaw))
                                  ? formatNum(cpmRaw)
                                  : undefined
                              }
                            >
                              {cpmRaw !== null && cpmRaw !== undefined && Number.isFinite(Number(cpmRaw))
                                ? formatCompactMetric(Number(cpmRaw))
                                : '—'}
                            </dd>
                          </div>
                        </dl>
                      </td>
                      <td
                        className={cn(
                          tdCell,
                          'sticky right-0 z-10 text-right bg-card shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] group-hover:bg-muted/30',
                        )}
                      >
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-[hsl(var(--heading))]"
                            asChild
                          >
                            <Link
                              to={`/admin/ads/${encodeURIComponent(id)}`}
                              aria-label={t('admin.editAdAria')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                aria-label={t('admin.moreActionsAria')}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {!expired ? (
                                <DropdownMenuItem
                                  disabled={toggleBusy}
                                  onClick={() => void act(id, running ? 'pause' : 'activate')}
                                >
                                  {running ? (
                                    <LangText path="admin.pause"  />
                                  ) : (
                                    <LangText path="admin.activate"  />
                                  )}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={deletingId === id}
                                onClick={(e) => openDeleteDialog(e, id, title)}
                              >
                                {deletingId === id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                <LangText path="messages.delete"  />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">
              {items.length === 0 ? (
                <LangText path="admin.no_ads_found"  />
              ) : (
                <LangText path="admin.no_ads_match_the_current_search_or_status_filter"
                />
              )}
            </p>
          )}
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <LangText path="admin.delete_ad"  />
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <LangText path="admin.this_permanently_removes_the_ad_from_the_platform_impression"
                />
              </span>
              {deleteTarget ? (
                <span className="block font-medium text-foreground pt-1">“{deleteTarget.title}”</span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>
              <LangText path="common.cancel"  />
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              <LangText path="messages.delete"  />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAdvertisements;
