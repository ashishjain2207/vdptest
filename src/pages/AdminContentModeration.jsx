import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@imriva/framework';
import {
  Flag,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
import { cn } from '@/lib/utils';
import { postPath } from '@/lib/appRoutes';
import {
  getAdminContentModerationCase,
  listAdminContentModerationCases,
  patchAdminContentModerationCase,
} from '@/services/adminContentModerationService';

function SummaryCard({ icon: Icon, labelPath, value, iconWrapClass, iconClass }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            <LangText path={labelPath} />
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconWrapClass)}>
          <Icon className={cn('h-5 w-5', iconClass)} aria-hidden />
        </div>
      </div>
    </div>
  );
}

/** @param {{ status: string }} props */
function StatusBadge({ status }) {
  const normalized = String(status || 'Pending').toLowerCase();
  const styles = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    reviewed: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    dismissed: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', styles[normalized] || styles.pending)}>
      {normalized}
    </span>
  );
}

/** @param {{ type: string }} props */
function ContentTypeBadge({ type }) {
  const normalized = String(type || 'Post');
  return (
    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
      {normalized}
    </span>
  );
}

function normalizeCase(row) {
  return {
    id: row?.id ?? row?.Id ?? '',
    createdAtUtc: row?.createdAtUtc ?? row?.CreatedAtUtc ?? '',
    contentType: row?.contentType ?? row?.ContentType ?? '',
    contentId: row?.contentId ?? row?.ContentId ?? '',
    contentPreview: row?.contentPreview ?? row?.ContentPreview ?? '',
    contentAuthorId: row?.contentAuthorId ?? row?.ContentAuthorId ?? '',
    contentAuthorDisplayName: row?.contentAuthorDisplayName ?? row?.ContentAuthorDisplayName ?? '',
    reportedById: row?.reportedById ?? row?.ReportedById ?? '',
    reportedByDisplayName: row?.reportedByDisplayName ?? row?.ReportedByDisplayName ?? '',
    reason: row?.reason ?? row?.Reason ?? '',
    status: row?.status ?? row?.Status ?? 'Pending',
    reviewedByDisplayName: row?.reviewedByDisplayName ?? row?.ReviewedByDisplayName ?? '',
    reviewedAtUtc: row?.reviewedAtUtc ?? row?.ReviewedAtUtc ?? null,
  };
}

function contentLinkForCase(item) {
  const type = String(item.contentType).toLowerCase();
  const id = item.contentId;
  if (!id) {
    return null;
  }
  if (type === 'post') {
    return postPath(id);
  }
  if (type === 'user') {
    return `/profile/${encodeURIComponent(id)}`;
  }
  return null;
}

export default function AdminContentModeration() {
  const t = useT();
  const { language } = useLanguage();
  const { endInitialFetch } = useRefreshOnlyFullPageLoader();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [items, setItems] = useState(/** @type {ReturnType<typeof normalizeCase>[]} */ ([]));
  const [summary, setSummary] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 });
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(/** @type {string | null} */ (null));
  const [detail, setDetail] = useState(/** @type {ReturnType<typeof normalizeCase> | null} */ (null));
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(/** @type {string | null} */ (null));

  const statusOptions = useMemo(
    () => [
      { value: 'all', labelPath: 'moderation.filterAll' },
      { value: 'pending', labelPath: 'moderation.statusPending' },
      { value: 'reviewed', labelPath: 'moderation.statusReviewed' },
      { value: 'resolved', labelPath: 'moderation.statusResolved' },
      { value: 'dismissed', labelPath: 'moderation.statusDismissed' },
    ],
    [],
  );

  const typeOptions = useMemo(
    () => [
      { value: 'all', labelPath: 'moderation.filterAll' },
      { value: 'post', labelPath: 'moderation.typePost' },
      { value: 'comment', labelPath: 'moderation.typeComment' },
      { value: 'user', labelPath: 'moderation.typeUser' },
    ],
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminContentModerationCases({
        status: statusFilter,
        contentType: typeFilter,
        page: 1,
        pageSize: 50,
      });
      setItems((data.items ?? []).map(normalizeCase));
      const s = data.summary ?? {};
      setSummary({
        total: s.total ?? s.Total ?? 0,
        pending: s.pending ?? s.Pending ?? 0,
        reviewed: s.reviewed ?? s.Reviewed ?? 0,
        resolved: s.resolved ?? s.Resolved ?? 0,
        dismissed: s.dismissed ?? s.Dismissed ?? 0,
      });
    } catch (e) {
      toast.error(e?.message || 'Failed to load queue');
      setItems([]);
    } finally {
      setLoading(false);
      endInitialFetch();
    }
  }, [statusFilter, typeFilter, endInitialFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);

    const loadDetail = async () => {
      try {
        const row = await getAdminContentModerationCase(detailId);
        if (cancelled) {
          return;
        }
        let normalized = normalizeCase(row);
        if (String(normalized.status).toLowerCase() === 'pending') {
          const reviewed = await patchAdminContentModerationCase(detailId, { status: 'Reviewed' });
          if (!cancelled) {
            normalized = normalizeCase(reviewed);
          }
        }
        if (!cancelled) {
          setDetail(normalized);
          setItems((prev) =>
            prev.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item)),
          );
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e?.message || 'Failed to load case');
          setDetailId(null);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const handleStatusUpdate = async (id, status) => {
    setBusyId(id);
    try {
      const updated = await patchAdminContentModerationCase(id, { status });
      const normalized = normalizeCase(updated);
      setDetail((prev) => (prev?.id === id ? normalized : prev));
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...normalized } : item)));
      toast.success(
        status === 'Resolved'
          ? t('moderation.caseResolved')
          : t('moderation.caseDismissed'),
      );
      await load();
    } catch (e) {
      toast.error(e?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) {
      return '—';
    }
    try {
      return new Date(iso).toLocaleString(language === 'DE' ? 'de-DE' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return String(iso);
    }
  };

  const detailLink = detail ? contentLinkForCase(detail) : null;
  const isTerminal = detail
    && ['resolved', 'dismissed'].includes(String(detail.status).toLowerCase());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12" data-testid="admin-content-moderation-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Flag className="h-7 w-7 text-amber-600" aria-hidden />
          <LangText path="moderation.adminTitle" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <LangText path="moderation.adminSubtitle" />
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Inbox}
          labelPath="moderation.summaryTotal"
          value={loading ? '…' : summary.total}
          iconWrapClass="bg-sky-100 dark:bg-sky-950/50"
          iconClass="text-sky-600 dark:text-sky-300"
        />
        <SummaryCard
          icon={Clock}
          labelPath="moderation.summaryPending"
          value={loading ? '…' : summary.pending}
          iconWrapClass="bg-amber-100 dark:bg-amber-950/50"
          iconClass="text-amber-600 dark:text-amber-300"
        />
        <SummaryCard
          icon={CheckCircle2}
          labelPath="moderation.summaryResolved"
          value={loading ? '…' : summary.resolved}
          iconWrapClass="bg-emerald-100 dark:bg-emerald-950/50"
          iconClass="text-emerald-600 dark:text-emerald-300"
        />
        <SummaryCard
          icon={XCircle}
          labelPath="moderation.summaryDismissed"
          value={loading ? '…' : summary.dismissed}
          iconWrapClass="bg-muted"
          iconClass="text-muted-foreground"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('moderation.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <LangText path={opt.labelPath} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('moderation.filterType')} />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <LangText path={opt.labelPath} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          <LangText path="common.refresh" />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading && items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            <LangText path="common.loading" />
          </p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            <LangText path="moderation.queueEmpty" />
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-4 hover:bg-muted/50 transition-colors"
                  data-testid="admin-moderation-case-row"
                  data-case-id={String(item.id)}
                  onClick={() => setDetailId(String(item.id))}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ContentTypeBadge type={item.contentType} />
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {item.contentPreview || item.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('moderation.reportedBy')}: {item.reportedByDisplayName || item.reportedById}
                        {' · '}
                        {formatDate(item.createdAtUtc)}
                      </p>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-1" aria-hidden />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <LangText path="moderation.caseDetailTitle" />
            </DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <p className="py-8 text-center text-muted-foreground">
              <LangText path="common.loading" />
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <ContentTypeBadge type={detail.contentType} />
                <StatusBadge status={detail.status} />
              </div>
              {detail.contentPreview ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    <LangText path="moderation.contentPreview" />
                  </p>
                  <p className="rounded-lg bg-muted/50 p-3 text-foreground whitespace-pre-wrap break-words">
                    {detail.contentPreview}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  <LangText path="moderation.reportReasonLabel" />
                </p>
                <p className="text-foreground whitespace-pre-wrap break-words">{detail.reason}</p>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                <div>
                  <dt className="inline font-medium">{t('moderation.reportedBy')}: </dt>
                  <dd className="inline">{detail.reportedByDisplayName || detail.reportedById}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">{t('moderation.contentAuthor')}: </dt>
                  <dd className="inline">{detail.contentAuthorDisplayName || detail.contentAuthorId || '—'}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">{t('moderation.reportedAt')}: </dt>
                  <dd className="inline">{formatDate(detail.createdAtUtc)}</dd>
                </div>
                {detail.reviewedAtUtc ? (
                  <div>
                    <dt className="inline font-medium">{t('moderation.reviewedAt')}: </dt>
                    <dd className="inline">
                      {formatDate(detail.reviewedAtUtc)}
                      {detail.reviewedByDisplayName ? ` (${detail.reviewedByDisplayName})` : ''}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {detailLink ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to={detailLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" aria-hidden />
                    <LangText path="moderation.viewContent" />
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
          {detail && !isTerminal ? (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                data-testid="admin-dismiss-case-button"
                disabled={busyId === detail.id}
                onClick={() => void handleStatusUpdate(detail.id, 'Dismissed')}
              >
                <LangText path="moderation.dismissCase" />
              </Button>
              <Button
                type="button"
                data-testid="admin-resolve-case-button"
                disabled={busyId === detail.id}
                onClick={() => void handleStatusUpdate(detail.id, 'Resolved')}
              >
                {busyId === detail.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                ) : null}
                <LangText path="moderation.resolveCase" />
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
