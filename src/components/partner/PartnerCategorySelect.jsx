import { useEffect, useState, useId } from 'react';
import { Input, Label } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { toast } from 'sonner';
import { adminListPartnerCategories, adminCreatePartnerCategory } from '@/services/partnerService';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { partnerCategoryLabel } from '@/lib/displayLabels';

/**
 * Platform-admin category combobox: click or focus opens the list; type to filter; add new at bottom when needed.
 * @param {{ value: string, onChange: (name: string) => void, id?: string, className?: string }} props
 */
export function PartnerCategorySelect({ value, onChange, id: idProp, className }) {
  const { language } = useLanguage();
  const t = useT();
  const autoId = useId();
  const inputId = idProp ?? `partner-cat-${autoId}`;
  const [categories, setCategories] = useState(/** @type {Array<{ id?: string, name?: string }>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await adminListPartnerCategories();
      setCategories(Array.isArray(list) ? list : []);
    } catch (e) {
      setCategories([]);
      toast.error(e?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const mergeCategoryIntoList = (item) => {
    setCategories((prev) => {
      const id = item.id ?? item.Id;
      const name = item.name ?? item.Name;
      if (id !== null && id !== undefined && prev.some((c) => String(c.id ?? c.Id) === String(id))) {
        return prev;
      }
      const next = [...prev, { id, name }];
      next.sort((a, b) =>
        String(a.name ?? a.Name ?? '').localeCompare(String(b.name ?? b.Name ?? ''), undefined, {
          sensitivity: 'base',
        }),
      );
      return next;
    });
  };

  const addNewCategoryToCatalog = async (rawName) => {
    const trimmed = (rawName || '').trim();
    if (!trimmed || adding) {
      return;
    }
    setAdding(true);
    try {
      const created = await adminCreatePartnerCategory(trimmed);
      const name = String(created?.name ?? created?.Name ?? trimmed);
      mergeCategoryIntoList(created);
      onChange(name);
      setSuggestionsOpen(false);
      toast.success(
        t('partners.category_added_to_the_list'),
      );
    } catch (err) {
      toast.error(err?.message || (t('partners.could_not_add_category')));
    } finally {
      setAdding(false);
    }
  };

  const openList = () => {
    setSuggestionsOpen(true);
    document.getElementById(inputId)?.focus();
  };

  const trimmedValue = (value ?? '').trim();
  const q = trimmedValue.toLowerCase();

  const filtered = categories
    .filter((c) => {
      const n = String(c.name ?? c.Name ?? '').toLowerCase();
      if (!q) {
        return true;
      }
      return n.includes(q);
    })
    .slice(0, 25);

  const hasExact =
    trimmedValue.length > 0 &&
    categories.some((c) => String(c.name ?? c.Name ?? '').toLowerCase() === trimmedValue.toLowerCase());

  const showAddNew = trimmedValue.length > 0 && !hasExact && trimmedValue.length <= 128;

  const placeholder =
    t('partners.select_category');

  const showPanel = suggestionsOpen && !loading && (categories.length > 0 || trimmedValue.length > 0);

  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Label htmlFor={inputId}>
        <LangText path="partners.category"  />
      </Label>
      {loading ? (
        <div className="flex h-11 items-center rounded-lg border border-input bg-muted/40 px-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          <span className="ml-2 text-sm text-muted-foreground">
            <LangText path="partners.loading_categories"  />
          </span>
        </div>
      ) : (
        <div className="relative">
          <Input
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setSuggestionsOpen(false), 200);
            }}
            onClick={() => setSuggestionsOpen(true)}
            maxLength={128}
            autoComplete="off"
            placeholder={placeholder}
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen}
            aria-controls={`${inputId}-suggestions`}
            className="h-11 w-full rounded-lg border-input bg-background pr-10 text-left placeholder:text-muted-foreground"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            aria-label={t('partners.open_category_list')}
            onMouseDown={(e) => {
              e.preventDefault();
              openList();
            }}
          >
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          </button>

          {showPanel ? (
            <ul
              id={`${inputId}-suggestions`}
              className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
              role="listbox"
            >
              {filtered.map((c) => {
                const rawNm = String(c.name ?? c.Name ?? '');
                const nm = partnerCategoryLabel(rawNm, language);
                const cid = c.id ?? c.Id ?? nm;
                return (
                  <li key={String(cid)}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onChange(nm);
                        setSuggestionsOpen(false);
                      }}
                    >
                      {nm}
                    </button>
                  </li>
                );
              })}
              {showAddNew ? (
                <li className="border-t border-border">
                  <button
                    type="button"
                    disabled={adding}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-primary hover:bg-accent disabled:opacity-60"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void addNewCategoryToCatalog(trimmedValue);
                    }}
                  >
                    {adding ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    <span>
                      {language === 'EN'
                        ? `Add "${trimmedValue}" as new category`
                        : `„${trimmedValue}“ als neue Kategorie hinzufügen`}
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
