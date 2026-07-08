import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
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
import { adminListEvents, adminDeleteEvent } from '@/services/adminEventService';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { ArrowLeft, Plus, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEventScheduleStatus,
  scheduleMatchesFilter,
  scheduleBadgeClassName,
  scheduleRowOpacityClassName,
} from '@/lib/adminScheduleStatus';
import { Badge } from '@/components/ui/badge';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { isPlaceholderScheduleStartUtc } from '@/components/admin/ScheduleDateTimeFields';
import { isDummyEvent, localizeEventTitle } from '@/lib/eventDisplay';
import { locationLabel } from '@/lib/displayLabels';

const PAGE_SIZE = 20;

const EVENT_SCHEDULE_SORT_ORDER = {
  active: 0,
  scheduled: 1,
  unconfirmed: 2,
  expired: 3,
};

/** @param {unknown} value */
function displayTextOrDash(value) {
  const text = String(value ?? '').trim();
  return text || '—';
}

/**
 * Platform admin: events list — search and pagination against admin API.
 */
const AdminEvents = () => {
  const { country } = useAdminScopeCountry();
  const { language } = useLanguage();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const t = useT();
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [scheduleFilter, setScheduleFilter] = useState(
    /** @type {'all' | 'active' | 'scheduled' | 'expired' | 'unconfirmed'} */ ('all'),
  );
  const { showRefreshLoader: loading, endInitialFetch } = useRefreshOnlyFullPageLoader();
  const [pageBusy, setPageBusy] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null));
  const [deleteTarget, setDeleteTarget] = useState(/** @type {{ id: string, title: string } | null} */ (null));
  const searchDebounceIsFirst = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(query);
      if (!searchDebounceIsFirst.current) {
        setPage(1);
      }
      searchDebounceIsFirst.current = false;
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setPageBusy(true);
    try {
      const res = await adminListEvents(page, PAGE_SIZE, debouncedQ);
      const raw = res?.data ?? res?.Data ?? [];
      setItems(
        (Array.isArray(raw) ? raw : []).filter((row) => !isDummyEvent(row)),
      );
      setTotalPages(Number(res?.totalPages ?? res?.TotalPages ?? 0));
    } catch (e) {
      toast.error(e?.message || t('toasts.failedLoadEvents'));
      setItems([]);
      setTotalPages(0);
    } finally {
      setPageBusy(false);
      endInitialFetch();
    }
  }, [page, debouncedQ, endInitialFetch]);

  useEffect(() => {
    void load();
  }, [load, country]);

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
      await adminDeleteEvent(id);
      toast.success(t('toasts.eventDeleted'));
      void load();
    } catch (e) {
      toast.error(e?.message || t('toasts.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const formatWhen = (iso) => {
    if (!iso) {
      return '—';
    }
    if (isPlaceholderScheduleStartUtc(String(iso))) {
      return t('admin.dateComingSoon');
    }
    try {
      return new Date(String(iso)).toLocaleString(language === 'DE' ? 'de-DE' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return '—';
    }
  };

  /** Schedule filter applies to the current page only (server-side pagination unchanged). */
  const displayRows = useMemo(() => {
    let rows = items;
    if (scheduleFilter !== 'all') {
      rows = rows.filter((row) => scheduleMatchesFilter(getEventScheduleStatus(row), scheduleFilter));
    }
    return [...rows].sort((a, b) => {
      const aKind = getEventScheduleStatus(a);
      const bKind = getEventScheduleStatus(b);
      return EVENT_SCHEDULE_SORT_ORDER[aKind] - EVENT_SCHEDULE_SORT_ORDER[bKind];
    });
  }, [items, scheduleFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4" />
              <LangText path="admin.back_to_admin_dashboard"  />
            </Link>
          </Button>
          <h1 className="partner-admin-heading">
            <LangText path="nav.events"  />
          </h1>
        </div>
        <Button
          asChild
          className="inline-flex gap-2 shadow-soft bg-primary text-primary-foreground hover:bg-secondary"
        >
          <Link
            to="/admin/events/create"
            className="inline-flex items-center !text-primary-foreground hover:!text-primary-foreground no-underline hover:no-underline"
          >
            <Plus className="w-4 h-4" />
            <LangText path="admin.add_event"  />
          </Link>
        </Button>
      </div>

      <ClearableSearchInput
        className="w-full"
        inputClassName="h-11 rounded-xl bg-card border-border shadow-sm"
        placeholder={t('admin.search_events')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        clearAriaLabel={t('common.clearSearch')}
        dataTestId="admin-events-search"
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
          /** @type {Array<{ key: 'all' | 'active' | 'scheduled' | 'expired' | 'unconfirmed', path: string }>} */ ([
            { key: 'all', path: 'common.all' },
            { key: 'active', path: 'status.active' },
            { key: 'scheduled', path: 'status.planned' },
            { key: 'expired', path: 'status.past' },
            { key: 'unconfirmed', path: 'status.dateComingSoon' },
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="w-[28%] p-4 font-semibold text-foreground"><LangText path="admin.title"  /></th>
                  <th className="w-[18%] p-4 font-semibold text-foreground"><LangText path="admin.start"  /></th>
                  <th className="w-[18%] p-4 font-semibold text-foreground whitespace-nowrap">
                    <LangText path="admin.status_2"  />
                  </th>
                  <th className="w-[15%] p-4 font-semibold text-foreground"><LangText path="partners.location"  /></th>
                  <th className="w-[15%] p-4 font-semibold text-foreground"><LangText path="admin.organizer"  /></th>
                  <th className="w-28 p-4 font-semibold text-foreground text-right"><LangText path="admin.actions"  /></th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  const id = String(row.id ?? row.Id ?? '');
                  const title = localizeEventTitle(row.title ?? row.Title, lang);
                  const start = row.startDateUtc ?? row.StartDateUtc;
                  const locRaw = String(row.location ?? row.Location ?? '').trim();
                  const loc = locRaw ? locationLabel(locRaw, lang) : '—';
                  const org = displayTextOrDash(row.organizer ?? row.Organizer);
                  const scheduleKind = getEventScheduleStatus(row);
                  return (
                    <tr
                      key={id}
                      className={cn(
                        'border-b border-border/80 last:border-0 hover:bg-muted/20 transition-colors',
                        scheduleRowOpacityClassName(scheduleKind),
                      )}
                    >
                      <td className="p-4 font-medium text-foreground truncate">{title}</td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {scheduleKind === 'unconfirmed' ? (
                          <LangText path="status.dateComingSoon"  />
                        ) : (
                          formatWhen(start)
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge variant="outline" className={cn('font-medium', scheduleBadgeClassName(scheduleKind))}>
                          {scheduleKind === 'expired' ? (
                            <LangText path="status.past"  />
                          ) : scheduleKind === 'scheduled' ? (
                            <LangText path="status.planned"  />
                          ) : scheduleKind === 'unconfirmed' ? (
                            <LangText path="status.dateComingSoon"  />
                          ) : (
                            <LangText path="status.active"  />
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground truncate">{loc}</td>
                      <td className="p-4 text-muted-foreground truncate">{org}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-[hsl(var(--heading))]" asChild>
                          <Link to={`/admin/events/${encodeURIComponent(id)}`} aria-label={t('admin.editEventAria')}>
                            <Pencil className="w-4 h-4" aria-hidden />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingId === id}
                          aria-label={t('admin.deleteEventAria')}
                          onClick={(e) => openDeleteDialog(e, id, title)}
                        >
                          {deletingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayRows.length === 0 && (
            <p className="p-10 text-center text-muted-foreground">
              {items.length === 0 ? (
                <LangText path="admin.no_events_found"  />
              ) : (
                <LangText path="admin.no_events_on_this_page_match_the_schedule_filter"
                />
              )}
            </p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || pageBusy}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            <LangText path="admin.previous"  />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || pageBusy}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <LangText path="admin.next"  />
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <LangText path="admin.delete_event"  />
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <LangText path="admin.this_permanently_removes_the_event_from_the_platform"
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

export default AdminEvents;
