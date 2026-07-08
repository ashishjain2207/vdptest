import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@imriva/framework';
import {
  MessageCircle,
  Headphones,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { toast } from 'sonner';
import {
  getAdminSupportInquiry,
  patchAdminSupportInquiry,
} from '@/services/adminSupportInquiryService';
import {
  getForwardSupportInquiryStatusOptions,
  isTerminalSupportInquiryStatus,
  normalizeSupportInquiryStatus,
  supportInquiryResolvedFieldLabel,
  supportInquiryResolveActionLabel,
  supportInquiryStatusLabel,
} from '@/lib/supportInquiryStatus';
import { useT, useTParams } from '@/i18n';
import { cn } from '@/lib/utils';

export { SUPPORT_INQUIRY_STATUS_OPTIONS } from '@/lib/supportInquiryStatus';

/** @param {{ status: string, language: string, inquiryType?: string }} props */
function IncidentStatusBadge({ status, language, inquiryType }) {
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

/**
 * @param {{
 *   open: boolean,
 *   inquiryId: string | null,
 *   onClose: () => void,
 *   onUpdated: () => void,
 *   onInquirySynced?: (detail: Record<string, unknown>) => void,
 *   language: string,
 * }} props
 */
export function AdminSupportIncidentDialog({ open, inquiryId, onClose, onUpdated, onInquirySynced, language }) {
  const t = useT();
  const tr = useTParams();
  const [detail, setDetail] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const onCloseRef = useRef(onClose);
  const onInquirySyncedRef = useRef(onInquirySynced);

  useEffect(() => {
    onCloseRef.current = onClose;
    onInquirySyncedRef.current = onInquirySynced;
  }, [onClose, onInquirySynced]);

  useEffect(() => {
    if (!open || !inquiryId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getAdminSupportInquiry(inquiryId);
        if (!cancelled) {
          setDetail(data);
          onInquirySyncedRef.current?.(data);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e?.message || 'Failed to load incident');
          onCloseRef.current();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, inquiryId]);

  const formatDt = (iso) => {
    if (!iso) {
      return '—';
    }
    try {
      return new Date(iso).toLocaleString(language === 'DE' ? 'de-DE' : 'en-US');
    } catch {
      return '—';
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!inquiryId || !nextStatus) {
      return;
    }
    setBusy(true);
    try {
      const updated = await patchAdminSupportInquiry(inquiryId, { status: nextStatus, isRead: true });
      setDetail(updated);
      onInquirySynced?.(updated);
      const inquiryType = String(detail?.inquiryType ?? detail?.InquiryType ?? '');
      const label = supportInquiryStatusLabel(nextStatus, language, inquiryType);
      toast.success(tr('support.statusSet', { label }));
      onUpdated();
    } catch (e) {
      toast.error(e?.message || 'Status update failed');
    } finally {
      setBusy(false);
    }
  };

  const type = String(detail?.inquiryType ?? detail?.InquiryType ?? '');
  const isSupport = type.toLowerCase() === 'support';
  const email = String(detail?.submitterEmail ?? detail?.SubmitterEmail ?? '');
  const status = normalizeSupportInquiryStatus(String(detail?.status ?? detail?.Status ?? 'New'), type);
  const category = String(detail?.category ?? detail?.Category ?? '');
  const submitterName = String(detail?.submitterName ?? detail?.SubmitterName ?? '—');
  const subjectText = String(detail?.subject ?? detail?.Subject ?? '').trim();
  const hasSubject = subjectText.length > 0;
  const headingText = hasSubject
    ? subjectText
    : isSupport
      ? t('support.supportRequestHeading')
      : t('support.feedbackSubmissionHeading');

  const forwardStatusOptions = useMemo(() => getForwardSupportInquiryStatusOptions(status, type), [status, type]);

  const statusActionLabel = isTerminalSupportInquiryStatus(status, type)
    ? language === 'DE'
      ? 'Status ändern'
      : 'Update status'
    : supportInquiryResolveActionLabel(type, language);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{headingText}</DialogTitle>
          <DialogDescription>
            {language === 'DE'
              ? `Unterstützungs-Ticket von ${submitterName}. Status aktualisieren.`
              : `Support ticket from ${submitterName}. Update status.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <LangText path="common.loading"  />
          </div>
        ) : detail ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/10 px-5 py-3 pr-12">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  isSupport
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-muted text-foreground',
                )}
              >
                {isSupport ? <Headphones className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                {type}
              </span>
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                {category}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4 pr-12">
              <div className="min-w-0 flex-1">
                <h2
                  id="support-incident-subject"
                  data-testid="support-incident-subject"
                  className={cn(
                    'text-xl font-semibold leading-snug tracking-tight break-words sm:text-2xl',
                    hasSubject ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {headingText}
                </h2>
                {!hasSubject ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    <LangText path="admin.no_subject_line_was_provided_for_this_submission"
                    />
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 self-start sm:self-center">
                <IncidentStatusBadge status={status} language={language} inquiryType={type} />
              </div>
            </div>

            <div className="space-y-6 px-5 py-5 max-h-[70vh] overflow-y-auto">
              <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <LangText path="admin.ticket_details"  />
                </p>
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <LangText path="admin.from"  />
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">{submitterName}</p>
                    {email ? (
                      <a href={`mailto:${email}`} className="mt-0.5 inline-block text-xs text-primary hover:underline break-all">
                        {email}
                      </a>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <LangText path="admin.submitted"  />
                    </p>
                    <p className="mt-0.5 text-foreground">{formatDt(detail.createdAtUtc ?? detail.CreatedAtUtc)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <LangText path="admin.opened"  />
                    </p>
                    <p className="mt-0.5 text-foreground">{formatDt(detail.openedAtUtc ?? detail.OpenedAtUtc)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <LangText path="admin.opened_by"  />
                    </p>
                    <p className="mt-0.5 text-foreground">
                      {String(detail.openedByDisplayName ?? detail.OpenedByDisplayName ?? '—')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {supportInquiryResolvedFieldLabel(type, language)}
                    </p>
                    <p className="mt-0.5 text-foreground">{formatDt(detail.resolvedAtUtc ?? detail.ResolvedAtUtc)}</p>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      <LangText path="admin.ticket_id"  />
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-foreground break-all">
                      {String(detail.id ?? detail.Id ?? '')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  data-testid="support-incident-customer-message-label"
                >
                  <LangText path="admin.customer_message"  />
                </p>
                <div
                  data-testid="support-incident-message"
                  className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words"
                >
                  {String(detail.message ?? detail.Message ?? '—')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
              {forwardStatusOptions.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2" disabled={busy}>
                      {statusActionLabel}
                      <ChevronDown className="h-4 w-4 opacity-80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[11rem]">
                    {forwardStatusOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        disabled={busy}
                        onClick={() => void handleStatusChange(opt.value)}
                      >
                        {t(opt.labelKey)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
