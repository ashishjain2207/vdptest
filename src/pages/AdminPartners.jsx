import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Avatar, AvatarImage, AvatarFallback, Badge } from '@imriva/framework';
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
import { adminListPartners, adminDeletePartner } from '@/services/partnerService';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { ArrowLeft, Plus, Loader2, Pencil, Crown, Trash2 } from 'lucide-react';
import { useRefreshOnlyFullPageLoader } from '@/hooks/useRefreshOnlyFullPageLoader';
import { cn } from '@/lib/utils';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, useTParams } from '@/i18n';
import {
  isDummyPartner,
  locationLabel,
  partnerCategoryLabel,
  partnerTierLabel,
} from '@/lib/displayLabels';
import { sortPartnersActiveFirst } from '@/lib/partnerSort';

/**
 * Platform admin: partner management list — table, search, maroon accent (mock-aligned).
 */
const AdminPartners = () => {
  const { country } = useAdminScopeCountry();
  const { language } = useLanguage();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const tParams = useTParams();
  const label = (key) => t(lang, `adminPartners.${key}`);
  const routerLocation = useLocation();
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const { showRefreshLoader: loading, endInitialFetch } = useRefreshOnlyFullPageLoader();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminListPartners(1, 200, includeInactive);
      const raw = res?.data ?? res?.items ?? [];
      const list = sortPartnersActiveFirst(
        (Array.isArray(raw) ? raw : []).filter((p) => !isDummyPartner(p)),
      );
      setItems(list);
    } catch (e) {
      toast.error(e?.message || t(lang, 'toasts.failedLoadPartners'));
      setItems([]);
    } finally {
      endInitialFetch();
    }
  }, [includeInactive, endInitialFetch]);

  useEffect(() => {
    void load();
  }, [load, country, routerLocation.key, routerLocation.state?.partnerListRefreshAt]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = sortPartnersActiveFirst(items);
    if (!q) {
      return sorted;
    }
    return sorted.filter((row) => {
      const name = String(row.name ?? '').toLowerCase();
      const handle = String(row.handle ?? '').toLowerCase();
      const cat = String(row.category ?? '').toLowerCase();
      const loc = String(row.location ?? '').toLowerCase();
      return name.includes(q) || handle.includes(q) || cat.includes(q) || loc.includes(q);
    });
  }, [items, query]);

  const summary = useMemo(() => {
    const total = items.length;
    const premium = items.filter((p) => String(p.tier ?? p.Tier ?? '') === 'Premium').length;
    return { total, premium };
  }, [items]);

  const [deletingId, setDeletingId] = useState(/** @type {string | null} */ (null));
  const [deleteTarget, setDeleteTarget] = useState(/** @type {{ id: string, name: string } | null} */ (null));

  const openDeleteDialog = (e, id, displayName) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget({ id, name: displayName || id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(id);
    try {
      await adminDeletePartner(id);
      toast.success(t(lang, 'toasts.partnerDeactivated'));
      await load();
    } catch (err) {
      toast.error(err?.message || t(lang, 'toasts.deactivateFailed'));
    } finally {
      setDeletingId(null);
    }
  };

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
            <LangText path="nav.partnerManagement"  />
          </h1>
          <p className="text-sm text-muted-foreground">
            {tParams('adminPartners.listSummary', { total: summary.total, premium: summary.premium })}
          </p>
        </div>
        <Button
          asChild
          className="inline-flex gap-2 shadow-soft bg-primary text-primary-foreground hover:bg-secondary"
        >
          <Link
            to="/admin/partners/create"
            className="inline-flex items-center !text-primary-foreground hover:!text-primary-foreground no-underline hover:no-underline"
          >
            <Plus className="w-4 h-4" />
            <LangText path="adminPartners.addPartner"  />
          </Link>
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
          aria-label={label('showInactive')}
          className="rounded border-border"
        />
        {label('showInactive')}
      </label>

      <ClearableSearchInput
        className="w-full"
        inputClassName="h-11 rounded-xl bg-card border-border shadow-sm"
        placeholder={label('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={label('searchPlaceholder')}
        clearAriaLabel={t(lang, 'common.clearSearch')}
        dataTestId="admin-partners-search"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <LangText path="common.loading"  />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="p-4 font-semibold text-foreground"><LangText path="admin.partner"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="partners.category"  /></th>
                  <th className="p-4 font-semibold text-foreground"><LangText path="partners.location"  /></th>
                  <th className="p-4 font-semibold text-foreground">
                    <LangText path="partner.partnerStatus"  />
                  </th>
                  <th className="p-4 font-semibold text-foreground text-right w-32"><LangText path="admin.actions"  /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const id = String(row.id ?? row.Id ?? '');
                  const handle = String(row.handle ?? '');
                  const name = String(row.name ?? '');
                  const logoUrl = String(row.logoUrl ?? row.LogoUrl ?? '');
                  const coverUrl = String(row.coverImageUrl ?? row.CoverImageUrl ?? '');
                  const category = row.category
                    ? partnerCategoryLabel(row.category, language)
                    : '—';
                  const locationDisplay = row.location
                    ? locationLabel(row.location, language)
                    : '—';
                  const tier = String(row.tier ?? 'Standard');
                  const isPremium = tier === 'Premium';
                  const isActiveRow = (row.isActive ?? row.IsActive) !== false;
                  return (
                    <tr
                      key={id}
                      className={cn(
                        'border-b border-border/80 last:border-0 transition-colors',
                        isActiveRow
                          ? 'hover:bg-muted/20'
                          : 'bg-zinc-100/90 hover:bg-zinc-100 dark:bg-zinc-900/45 dark:hover:bg-zinc-900/55 border-l-[3px] border-l-zinc-300/80 dark:border-l-zinc-600/60',
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="flex items-center gap-2 shrink-0">
                            {coverUrl ? (
                              <div className="h-10 w-14 overflow-hidden rounded-md border border-border bg-muted/30">
                                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                              </div>
                            ) : null}
                            <Avatar className="h-10 w-10 rounded-full border border-border">
                              <AvatarImage src={logoUrl || undefined} alt="" />
                              <AvatarFallback className="text-xs rounded-full">{name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1 flex-wrap">
                              {name}
                              {isPremium && <span className="text-amber-500 text-base leading-none" aria-hidden>👑</span>}
                              {!isActiveRow ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal border-zinc-300/90 bg-zinc-200/70 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300"
                                >
                                  <LangText path="admin.inactive"  />
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-muted-foreground text-xs">@{handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground/90">
                          {category}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-[220px] truncate">{locationDisplay}</td>
                      <td className="p-4">
                        {isPremium ? (
                          <span className="partner-premium-badge inline-flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 text-amber-600" aria-hidden />
                            {partnerTierLabel('Premium', language)}
                          </span>
                        ) : (
                          <span className="partner-standard-badge">
                            {partnerTierLabel('Standard', language)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-[hsl(var(--heading))]" asChild>
                            <Link to={`/admin/partners/${encodeURIComponent(id)}`} aria-label="Edit partner">
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                          {isActiveRow ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === id}
                              aria-label="Deactivate partner"
                              onClick={(e) => openDeleteDialog(e, id, name)}
                            >
                              {deletingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          ) : null}
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
              <LangText path="admin.no_partners_match_your_search"  />
            </p>
          )}
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <LangText path="admin.deactivate_partner_2"  />
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <LangText path="admin.this_hides_the_partner_from_discovery_and_event_organizer_li"
                />{' '}
                {label('inactiveDialogHint')}
              </span>
              {deleteTarget ? (
                <span className="block font-medium text-foreground pt-1">
                  “{deleteTarget.name}”
                </span>
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
              <LangText path="admin.deactivate"  />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPartners;
