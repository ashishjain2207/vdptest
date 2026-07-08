import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button } from '@imriva/framework';
import { ClipboardList, Eye, Loader2, RefreshCw } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AuditLogDetailBadges from '@/components/admin/AuditLogDetailBadges';
import AuditLogTechnicalDetails from '@/components/admin/AuditLogTechnicalDetails';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
import {
  formatAuditActorDisplay,
  formatAuditAffectedUser,
  formatAuditEntitySummary,
  getAuditDetailItems,
  parseAuditDetails,
} from '@/lib/auditLogPresentation';
import { listAdminAuditLogs } from '@/services/adminAuditLogService';

const ENTITY_TYPE_OPTIONS = [
  { value: 'all', labelPath: 'adminAuditLogs.filterAll' },
  { value: 'PlatformSettings', labelPath: 'adminAuditLogs.entityPlatformSettings' },
  { value: 'User', labelPath: 'adminAuditLogs.entityUser' },
  { value: 'ContentModerationCase', labelPath: 'adminAuditLogs.entityContentModeration' },
];

const ACTION_OPTIONS = [
  { value: 'all', labelPath: 'adminAuditLogs.filterAll' },
  { value: 'PlatformSettings.Updated', labelPath: 'adminAuditLogs.actionPlatformSettingsUpdated' },
  { value: 'User.Suspended', labelPath: 'adminAuditLogs.actionUserSuspended' },
  { value: 'User.Unsuspended', labelPath: 'adminAuditLogs.actionUserUnsuspended' },
  { value: 'User.PlatformRoleChanged', labelPath: 'adminAuditLogs.actionUserRoleChanged' },
  { value: 'ContentModeration.ReportSubmitted', labelPath: 'adminAuditLogs.actionReportSubmitted' },
  { value: 'ContentModeration.StatusChanged', labelPath: 'adminAuditLogs.actionModerationStatusChanged' },
];

function normalizeRow(row) {
  return {
    id: row?.id ?? row?.Id ?? '',
    createdAtUtc: row?.createdAtUtc ?? row?.CreatedAtUtc ?? '',
    userId: row?.userId ?? row?.UserId ?? '',
    userDisplayName: row?.userDisplayName ?? row?.UserDisplayName ?? '',
    action: row?.action ?? row?.Action ?? '',
    entityType: row?.entityType ?? row?.EntityType ?? '',
    entityId: row?.entityId ?? row?.EntityId ?? '',
    entityDisplayName: row?.entityDisplayName ?? row?.EntityDisplayName ?? '',
    details: row?.details ?? row?.Details ?? '',
    ipAddress: row?.ipAddress ?? row?.IpAddress ?? '',
  };
}

function formatWhen(iso, locale) {
  if (!iso) {
    return '—';
  }
  try {
    return new Date(iso).toLocaleString(locale);
  } catch {
    return iso;
  }
}

function useAuditRowPresentation(row, t, lang, actionLabel, entityLabel) {
  return useMemo(() => {
    const parsed = parseAuditDetails(row?.details);
    const detailItems = getAuditDetailItems(parsed, t, lang);
    return {
      actor: formatAuditActorDisplay(row?.userDisplayName, t),
      entity: formatAuditEntitySummary(row, entityLabel, t),
      affectedUser: formatAuditAffectedUser(row, t),
      actionText: actionLabel(row?.action),
      detailItems,
      hasDetails: detailItems.length > 0 || Boolean(row?.details),
    };
  }, [row, t, lang, actionLabel, entityLabel]);
}

function AuditLogRowSummary({ row, presentation, onViewDetails, compactDetails = false }) {
  return (
    <>
      <div className="font-medium text-foreground">{presentation.actor}</div>
      <Badge variant="secondary" className="mt-1 w-fit max-w-full whitespace-normal font-normal">
        {presentation.actionText}
      </Badge>
      <div className="mt-2 text-sm text-muted-foreground">{presentation.entity}</div>
      {presentation.detailItems.length > 0 ? (
        <div className="mt-2">
          <AuditLogDetailBadges items={presentation.detailItems} compact={compactDetails} />
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          <LangText path="adminAuditLogs.noDetails" />
        </p>
      )}
      {presentation.hasDetails ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-2 h-auto px-0 text-primary"
          onClick={() => onViewDetails(row)}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          <LangText path="adminAuditLogs.viewDetails" />
        </Button>
      ) : null}
    </>
  );
}

function AuditLogMobileCard({ row, locale, t, language, actionLabel, entityLabel, onViewDetails }) {
  const presentation = useAuditRowPresentation(row, t, language, actionLabel, entityLabel);

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <time className="text-xs tabular-nums text-muted-foreground">
        {formatWhen(row.createdAtUtc, locale)}
      </time>
      <AuditLogRowSummary
        row={row}
        presentation={presentation}
        onViewDetails={onViewDetails}
        compactDetails
      />
    </article>
  );
}

export default function AdminAuditLogs() {
  const { language } = useLanguage();
  const locale = language === 'DE' ? 'de-DE' : 'en-US';
  const t = useT();
  const [entityType, setEntityType] = useState('all');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminAuditLogs({
        entityType,
        action,
        page,
        pageSize,
      });
      setRows((result.items || []).map(normalizeRow));
      setTotalPages(result.totalPages || 0);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      toast.error(err?.message || t('adminAuditLogs.loadFailed'));
      setRows([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [action, entityType, page, pageSize, t]);

  useRefreshOnlyFullPageLoader(loading && rows.length === 0);
  useEffect(() => {
    load();
  }, [load]);

  const actionLabel = useMemo(() => {
    const map = Object.fromEntries(
      ACTION_OPTIONS.filter((o) => o.value !== 'all').map((o) => [o.value, t(o.labelPath)]),
    );
    return (value) => map[value] || value || '—';
  }, [t]);

  const entityLabel = useMemo(() => {
    const map = Object.fromEntries(
      ENTITY_TYPE_OPTIONS.filter((o) => o.value !== 'all').map((o) => [o.value, t(o.labelPath)]),
    );
    return (value) => map[value] || value || '—';
  }, [t]);

  const selectedPresentation = useAuditRowPresentation(selected, t, language, actionLabel, entityLabel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" aria-hidden />
            <LangText path="adminAuditLogs.title" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <LangText path="adminAuditLogs.subtitle" />
          </p>
        </div>
        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          <span className="ml-2">
            <LangText path="adminAuditLogs.refresh" />
          </span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={t('adminAuditLogs.entityType')} />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <LangText path={opt.labelPath} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder={t('adminAuditLogs.action')} />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <LangText path={opt.labelPath} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-sm">
          <LangText path="common.loading" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-sm">
          <LangText path="adminAuditLogs.empty" />
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <AuditLogMobileCard
                key={row.id}
                row={row}
                locale={locale}
                t={t}
                language={language}
                actionLabel={actionLabel}
                entityLabel={entityLabel}
                onViewDetails={setSelected}
              />
            ))}
          </div>

          <div className="hidden rounded-xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium whitespace-nowrap"><LangText path="adminAuditLogs.when" /></th>
                    <th className="px-4 py-3 font-medium min-w-[140px]"><LangText path="adminAuditLogs.actor" /></th>
                    <th className="px-4 py-3 font-medium min-w-[160px]"><LangText path="adminAuditLogs.action" /></th>
                    <th className="px-4 py-3 font-medium min-w-[140px]"><LangText path="adminAuditLogs.entity" /></th>
                    <th className="px-4 py-3 font-medium min-w-[220px]"><LangText path="adminAuditLogs.details" /></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <AuditLogTableRow
                      key={row.id}
                      row={row}
                      locale={locale}
                      t={t}
                      language={language}
                      actionLabel={actionLabel}
                      entityLabel={entityLabel}
                      onViewDetails={setSelected}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">
            {totalCount} {t('adminAuditLogs.entries')}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              <LangText path="adminAuditLogs.prev" />
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              <LangText path="adminAuditLogs.next" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle><LangText path="adminAuditLogs.detailsTitle" /></DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground"><LangText path="adminAuditLogs.action" /></dt>
                  <dd className="mt-0.5 font-medium text-foreground">{selectedPresentation.actionText}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground"><LangText path="adminAuditLogs.when" /></dt>
                  <dd className="mt-0.5 tabular-nums text-foreground">{formatWhen(selected.createdAtUtc, locale)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground"><LangText path="adminAuditLogs.actor" /></dt>
                  <dd className="mt-0.5 font-medium text-foreground">{selectedPresentation.actor}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    <LangText path={selectedPresentation.affectedUser ? 'adminAuditLogs.affectedUser' : 'adminAuditLogs.entity'} />
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {selectedPresentation.affectedUser ?? selectedPresentation.entity}
                  </dd>
                </div>
                {selected.ipAddress ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground"><LangText path="adminAuditLogs.ip" /></dt>
                    <dd className="mt-0.5 font-mono text-foreground">{selected.ipAddress}</dd>
                  </div>
                ) : null}
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <LangText path="adminAuditLogs.details" />
                </p>
                {selectedPresentation.detailItems.length > 0 ? (
                  <AuditLogDetailBadges items={selectedPresentation.detailItems} />
                ) : (
                  <p className="text-muted-foreground"><LangText path="adminAuditLogs.noDetails" /></p>
                )}
              </div>

              <AuditLogTechnicalDetails row={selected} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditLogTableRow({ row, locale, t, language, actionLabel, entityLabel, onViewDetails }) {
  const presentation = useAuditRowPresentation(row, t, language, actionLabel, entityLabel);

  return (
    <tr className="border-b border-border last:border-0 align-top hover:bg-muted/30">
      <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
        {formatWhen(row.createdAtUtc, locale)}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{presentation.actor}</div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className="whitespace-normal font-normal">
          {presentation.actionText}
        </Badge>
      </td>
      <td className="px-4 py-3 text-foreground">{presentation.entity}</td>
      <td className="px-4 py-3">
        {presentation.detailItems.length > 0 ? (
          <AuditLogDetailBadges items={presentation.detailItems} compact />
        ) : (
          <span className="text-muted-foreground"><LangText path="adminAuditLogs.noDetails" /></span>
        )}
        {presentation.hasDetails ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="mt-1 h-auto px-0 text-primary"
            onClick={() => onViewDetails(row)}
          >
            <LangText path="adminAuditLogs.viewDetails" />
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
