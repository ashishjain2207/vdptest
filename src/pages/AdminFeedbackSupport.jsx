import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@imriva/framework';
import {
  Inbox,
  Sparkles,
  LifeBuoy,
  Lightbulb,
  Headphones,
  MessageCircle,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
import { useSupportInboxRealtimeRefresh } from '@/hooks/useSupportInboxRealtimeRefresh';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import {
  listAdminSupportInquiries,
  reopenAdminSupportInquiry,
  resolveAdminSupportInquiry,
} from '@/services/adminSupportInquiryService';
import { AdminSupportIncidentDialog } from '@/components/admin/AdminSupportIncidentDialog';
import {
  getSupportInquiryFilterStatusOptions,
  isTerminalSupportInquiryStatus,
  normalizeSupportInquiryStatus,
  supportInquiryResolvedToastMessage,
  supportInquiryResolveActionLabel,
  supportInquiryStatusLabel,
} from '@/lib/supportInquiryStatus';
import { cn } from '@/lib/utils';

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

/** @param {{ type: string }} props */
function TypeBadge({ type }) {
  const isSupport = String(type).toLowerCase() === 'support';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        isSupport
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
          : 'bg-muted text-foreground',
      )}
    >
      {isSupport ? <Headphones className="h-3 w-3" aria-hidden /> : <MessageCircle className="h-3 w-3" aria-hidden />}
      {isSupport ? (
        <LangText path="nav.supportInbox"  />
      ) : (
        <LangText path="layout.feedback"  />
      )}
    </span>
  );
}

/** @param {{ category: string }} props */
function CategoryBadge({ category }) {
  const slug = String(category || 'general').toLowerCase();
  const isBug = slug === 'bug';
  const isFeature = slug === 'feature';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        isBug && 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        isFeature && 'bg-primary/10 text-primary',
        !isBug && !isFeature && 'bg-muted text-muted-foreground',
      )}
    >
      {slug}
    </span>
  );
}

/** @param {{ status: string, language: string, inquiryType?: string }} props */
function StatusBadge({ status, language, inquiryType }) {
  const normalized = normalizeSupportInquiryStatus(status, inquiryType);
  const label = supportInquiryStatusLabel(normalized, language, inquiryType);
  const tone =
    normalized === 'New'
      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
      : normalized === 'Open' || normalized === 'Reviewed'
        ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
        : normalized === 'InProgress'
          ? 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300'
          : normalized === 'OnHold'
            ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            : normalized === 'Resolved' || normalized === 'Actioned'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', tone)}>{label}</span>
  );
}

const TYPE_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'support.allTypes' },
  { value: 'Support', labelKey: 'support.typeSupport' },
  { value: 'Feedback', labelKey: 'support.typeFeedback' },
];

const filterSelectTriggerClass =
  'h-8 rounded-lg border-border bg-card px-2 text-xs shadow-sm focus:ring-2 focus:ring-primary/30 [&>span]:truncate [&_svg]:h-3.5 [&_svg]:w-3.5';

const filterSelectContentClass =
  'rounded-lg border-border bg-card p-0.5 shadow-md';

const filterSelectItemClass =
  'rounded-md py-1.5 pl-7 pr-2 text-xs data-[highlighted]:bg-rose-50 data-[state=checked]:bg-rose-50 data-[highlighted]:text-foreground data-[state=checked]:text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5';

/** @param {{ value: string, onValueChange: (v: string) => void, options: Array<{ value: string, labelKey: string }>, ariaLabel: string, triggerClassName?: string }} props */
function AdminInboxFilterSelect({ value, onValueChange, options, ariaLabel, triggerClassName }) {
  const t = useT();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(filterSelectTriggerClass, triggerClassName)}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={filterSelectContentClass} position="popper">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className={filterSelectItemClass}>
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * @param {{ initialDetailId?: string | null }} [props]
 */
const AdminFeedbackSupport = ({ initialDetailId = null }) => {
  const { country } = useAdminScopeCountry();
  const { language } = useLanguage();
  const t = useT();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const statusFilterOptions = useMemo(
    () => [
      { value: 'all', labelKey: 'support.allStatuses' },
      ...getSupportInquiryFilterStatusOptions(typeFilter),
    ],
    [typeFilter],
  );
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    supportActive: 0,
    feedbackActive: 0,
  });
  const { showRefreshLoader: loading, endInitialFetch } = useRefreshOnlyFullPageLoader();
  const [busyId, setBusyId] = useState(/** @type {string | null} */ (null));
  const [detailId, setDetailId] = useState(/** @type {string | null} */ (null));

  const load = useCallback(async () => {
    try {
      const res = await listAdminSupportInquiries({ type: typeFilter, status: statusFilter });
      const raw = res?.items ?? [];
      setItems(Array.isArray(raw) ? raw : []);
      const s = res?.summary ?? {};
      setSummary({
        total: Number(s.total ?? s.Total ?? 0),
        unread: Number(s.unread ?? s.Unread ?? 0),
        supportActive: Number(s.supportActive ?? s.SupportActive ?? 0),
        feedbackActive: Number(s.feedbackActive ?? s.FeedbackActive ?? 0),
      });
    } catch (e) {
      toast.error(e?.message || 'Failed to load inbox');
      setItems([]);
    } finally {
      endInitialFetch();
    }
  }, [typeFilter, statusFilter, endInitialFetch]);

  useEffect(() => {
    if (statusFilter !== 'all' && !statusFilterOptions.some((opt) => opt.value === statusFilter)) {
      setStatusFilter('all');
    }
  }, [statusFilter, statusFilterOptions]);

  useEffect(() => {
    void load();
  }, [load, country]);

  useSupportInboxRealtimeRefresh(load);

  useEffect(() => {
    if (initialDetailId) {
      setDetailId(String(initialDetailId));
    }
  }, [initialDetailId]);

  const syncInquiryInList = useCallback((detail) => {
    const id = String(detail?.id ?? detail?.Id ?? '');
    if (!id) {
      return;
    }

    setItems((prev) => {
      const existing = prev.find((row) => String(row.id ?? row.Id ?? '') === id);
      const wasUnread = existing ? !(existing.isRead ?? existing.IsRead) : false;
      if (wasUnread) {
        setSummary((s) => ({ ...s, unread: Math.max(0, s.unread - 1) }));
      }

      return prev.map((row) => {
        const rowId = String(row.id ?? row.Id ?? '');
        if (rowId !== id) {
          return row;
        }
        return {
          ...row,
          status: detail.status ?? detail.Status ?? row.status ?? row.Status,
          isRead: detail.isRead ?? detail.IsRead ?? true,
          openedAtUtc: detail.openedAtUtc ?? detail.OpenedAtUtc ?? row.openedAtUtc ?? row.OpenedAtUtc,
          openedByDisplayName:
            detail.openedByDisplayName ?? detail.OpenedByDisplayName ?? row.openedByDisplayName ?? row.OpenedByDisplayName,
          resolvedAtUtc: detail.resolvedAtUtc ?? detail.ResolvedAtUtc ?? row.resolvedAtUtc ?? row.ResolvedAtUtc,
          resolvedByDisplayName:
            detail.resolvedByDisplayName
            ?? detail.ResolvedByDisplayName
            ?? row.resolvedByDisplayName
            ?? row.ResolvedByDisplayName,
        };
      });
    });
  }, []);

  const handleReopen = async (id) => {
    setBusyId(id);
    try {
      const updated = await reopenAdminSupportInquiry(id);
      syncInquiryInList(updated);
      await load();
    } catch (e) {
      toast.error(e?.message || 'Reopen failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleCloseDetail = useCallback(() => setDetailId(null), []);

  const handleResolve = async (id, inquiryType) => {
    setBusyId(id);
    try {
      const updated = await resolveAdminSupportInquiry(id);
      syncInquiryInList(updated);
      toast.success(supportInquiryResolvedToastMessage(inquiryType, language));
      await load();
    } catch (e) {
      toast.error(e?.message || 'Resolve failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Inbox}
          labelPath="support.inboxTotal"
          value={loading ? '…' : summary.total}
          iconWrapClass="bg-sky-100 dark:bg-sky-950/50"
          iconClass="text-sky-600 dark:text-sky-300"
        />
        <SummaryCard
          icon={Sparkles}
          labelPath="support.inboxNewUnread"
          value={loading ? '…' : summary.unread}
          iconWrapClass="bg-amber-100 dark:bg-amber-950/50"
          iconClass="text-amber-600 dark:text-amber-300"
        />
        <SummaryCard
          icon={LifeBuoy}
          labelPath="support.inboxSupportActive"
          value={loading ? '…' : summary.supportActive}
          iconWrapClass="bg-rose-100 dark:bg-rose-950/50"
          iconClass="text-rose-600 dark:text-rose-300"
        />
        <SummaryCard
          icon={Lightbulb}
          labelPath="support.inboxFeedbackActive"
          value={loading ? '…' : summary.feedbackActive}
          iconWrapClass="bg-amber-100 dark:bg-amber-950/50"
          iconClass="text-amber-500 dark:text-amber-300"
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="partner-admin-heading text-xl">
            <LangText path="admin.support_inbox"  />
          </h2>
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
            <AdminInboxFilterSelect
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={TYPE_FILTER_OPTIONS}
              ariaLabel={t('support.filterByType')}
              triggerClassName="w-[6.75rem]"
            />
            <AdminInboxFilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusFilterOptions}
              ariaLabel={t('support.filterByStatus')}
              triggerClassName="w-[7.25rem]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <LangText path="common.loading"  />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="p-4 font-semibold text-foreground">
                    <LangText path="admin.from"  />
                  </th>
                  <th className="p-4 font-semibold text-foreground">
                    <LangText path="admin.type"  />
                  </th>
                  <th className="p-4 font-semibold text-foreground">
                    <LangText path="partners.category"  />
                  </th>
                  <th className="p-4 font-semibold text-foreground">
                    <LangText path="admin.status_2"  />
                  </th>
                  <th className="p-4 font-semibold text-foreground text-right w-40">
                    <LangText path="admin.actions"  />
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <LangText path="admin.no_items_match_your_filters"  />
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const id = String(row.id ?? row.Id ?? '');
                    const isRead = row.isRead ?? row.IsRead;
                    const inquiryType = String(row.inquiryType ?? row.InquiryType ?? '');
                    const status = String(row.status ?? row.Status ?? 'New');
                    const isTerminal = isTerminalSupportInquiryStatus(status, inquiryType);
                    const email = String(row.submitterEmail ?? row.SubmitterEmail ?? '');
                    const busy = busyId === id;
                    return (
                      <tr
                        key={id}
                        className={cn(
                          'border-b border-border/80 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors',
                          !isRead && 'bg-primary/[0.04]',
                        )}
                        onClick={() => setDetailId(id)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {!isRead ? (
                              <span className="h-2 w-2 rounded-full bg-destructive shrink-0" aria-hidden />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {String(row.submitterName ?? row.SubmitterName ?? '—')}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <TypeBadge type={String(row.inquiryType ?? row.InquiryType ?? '')} />
                        </td>
                        <td className="p-4">
                          <CategoryBadge category={String(row.category ?? row.Category ?? '')} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={status} language={language} inquiryType={inquiryType} />
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={busy || !isTerminal}
                              onClick={() => handleReopen(id)}
                              aria-label={
                                inquiryType.toLowerCase() === 'feedback'
                                  ? language === 'DE'
                                    ? 'Erneut als geprüft markieren'
                                    : 'Mark reviewed again'
                                  : language === 'DE'
                                    ? 'Wieder öffnen'
                                    : 'Reopen'
                              }
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                              disabled={busy || isTerminal}
                              onClick={() => handleResolve(id, inquiryType)}
                              aria-label={supportInquiryResolveActionLabel(inquiryType, language)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminSupportIncidentDialog
        open={Boolean(detailId)}
        inquiryId={detailId}
        onClose={handleCloseDetail}
        onInquirySynced={syncInquiryInList}
        onUpdated={() => void load()}
        language={language}
      />
    </div>
  );
};

export default AdminFeedbackSupport;
