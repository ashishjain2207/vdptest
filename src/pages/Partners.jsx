import { MainLayout } from '@/components/layout/MainLayout';
import { PartnerCard } from '@/components/partner/PartnerCard';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LangText } from '@/components/ui/LangText';
import { listPartners } from '@/services/partnerService';
import { cn } from '@/lib/utils';
import { sortPartnersPremiumFirst } from '@/lib/partnerSort';
import { isDummyPartner, partnerCategoryMatchesFilter } from '@/lib/displayLabels';
import { useT } from '@/i18n';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { useStaffScopeContentRefresh } from '@/lib/platformAdminFeedScopeRefresh';

const FILTER_CHIPS = /** @type {const} */ ([
  { id: 'all', labelKey: 'partners.filterAll' },
  { id: 'Bank', labelKey: 'partners.filterBank' },
  { id: 'RealEstate', labelKey: 'partners.filterRealEstate' },
  { id: 'Certification', labelKey: 'partners.filterCertification' },
  { id: 'Association', labelKey: 'partners.filterAssociation' },
]);

const Partners = () => {
  const t = useT();
  const label = (key) => t(`partners.${key}`);
  const [searchQuery, setSearchQuery] = useState('');
  const [chip, setChip] = useState('all');
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPartners(1, 200);
      const raw = res?.data ?? res?.items ?? [];
      const list = (Array.isArray(raw) ? raw : []).filter((p) => !isDummyPartner(p));
      setItems(sortPartnersPremiumFirst(list));
    } catch (e) {
      setError(e?.message || 'Failed to load partners');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPartners();
  }, [loadPartners]);

  useStaffScopeContentRefresh(() => {
    void loadPartners();
  });

  const filtered = useMemo(() => {
    const list = items.filter((p) => {
      if (isDummyPartner(p)) {
        return false;
      }
      if (chip !== 'all') {
        if (!partnerCategoryMatchesFilter(p.category, chip)) {
          return false;
        }
      }
      if (!searchQuery.trim()) {
        return true;
      }
      const q = searchQuery.toLowerCase();
      const name = String(p.name ?? '').toLowerCase();
      const handle = String(p.handle ?? '').toLowerCase();
      const desc = String(p.description ?? '').toLowerCase();
      const loc = String(p.location ?? '').toLowerCase();
      return name.includes(q) || handle.includes(q) || desc.includes(q) || loc.includes(q);
    });
    return sortPartnersPremiumFirst(list);
  }, [items, chip, searchQuery]);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            <LangText path="nav.partners"  />
          </h1>
          <p className="text-muted-foreground mt-1">{label('subtitle')}</p>
        </div>

        <ClearableSearchInput
          placeholder={label('searchPlaceholder')}
          aria-label={label('searchPlaceholder')}
          inputClassName="h-11 rounded-xl bg-card border-border shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearAriaLabel={t('common.clearSearch')}
          dataTestId="partners-search"
        />

        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((c) => {
            const chipLabel = t(c.labelKey);
            const active = chip === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChip(c.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border',
                  active
                    ? 'bg-[hsl(var(--heading))] text-primary-foreground border-transparent shadow-sm'
                    : 'bg-card text-foreground border-border hover:bg-muted/60',
                )}
              >
                {chipLabel}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-12" aria-busy="true">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : null}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((partner) => (
              <PartnerCard key={String(partner.id)} partner={partner} variant="discovery" />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12 rounded-xl border border-dashed border-border">
            <LangText path="common.no_partners_match_your_filters"  />
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default Partners;
