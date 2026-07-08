import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import {
  filterCountryCatalog,
  getMarketCountryLabel,
  getAllCountriesForPicker,
  getPopularCountriesForPicker,
} from '@/lib/marketCountryCodes.js';
import { normalizeCountryCode } from '@/lib/activeCountry.js';
import { useCountryPickerCatalog } from '@/hooks/useCountryPickerCatalog.js';

/**
 * Searchable country picker backed by the global catalog or backend-supported lists.
 *
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (code: string) => void,
 *   language: 'EN' | 'DE',
 *   disabled?: boolean,
 *   allowEmpty?: boolean,
 *   showFooterHint?: boolean,
 *   source?: 'supported' | 'available',
 *   className?: string,
 *   inputClassName?: string,
 *   placeholder?: string,
 *   'aria-label'?: string,
 *   'aria-invalid'?: boolean,
 *   'aria-describedby'?: string,
 * }} props
 */
export function CountryMarketCombobox({
  id: idProp,
  value,
  onChange,
  language,
  disabled = false,
  allowEmpty = false,
  showFooterHint = true,
  source,
  className,
  inputClassName,
  placeholder,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const lang = language === 'DE' ? 'DE' : 'EN';
  const t = useT();
  const { catalog: apiCatalog, loading, isEmpty } = useCountryPickerCatalog(source);
  const usesApiCatalog = Boolean(source);

  const staticPopularCountries = useMemo(() => getPopularCountriesForPicker(lang), [lang]);
  const staticAllCountries = useMemo(() => getAllCountriesForPicker(lang), [lang]);

  const allCountries = usesApiCatalog ? apiCatalog : staticAllCountries;
  const popularCountries = usesApiCatalog
    ? apiCatalog
    : staticPopularCountries;

  const normalizedValue = useMemo(() => normalizeCountryCode(value) ?? '', [value]);

  const isSupportedSource = source === 'supported';
  const isBoundedCatalog = usesApiCatalog;
  const showCatalogFooter = showFooterHint && !isBoundedCatalog && !isSupportedSource;

  const allMarketsLabel = t('common.all_markets');

  const displayValue = useMemo(() => {
    if (!normalizedValue) {
      return allowEmpty ? allMarketsLabel : '';
    }
    const apiMatch = usesApiCatalog
      ? apiCatalog.find((entry) => entry.code === normalizedValue)
      : null;
    if (apiMatch) {
      return apiMatch.label;
    }
    return getMarketCountryLabel(normalizedValue, lang);
  }, [normalizedValue, lang, allowEmpty, allMarketsLabel, usesApiCatalog, apiCatalog]);

  const resolvedPlaceholder = useMemo(() => {
    if (placeholder) {
      return placeholder;
    }
    if (isSupportedSource) {
      return open ? t('common.search_supported_countries') : t('common.select_supported_country');
    }
    return t('common.search_or_select_country');
  }, [placeholder, isSupportedSource, open, t]);

  const combinedAriaDescribedBy = ariaDescribedBy || undefined;

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const suggestions = useMemo(() => {
    if (usesApiCatalog && (loading || isEmpty)) {
      return [];
    }
    if (!isSearching) {
      return isBoundedCatalog ? allCountries : popularCountries;
    }
    return filterCountryCatalog(allCountries, trimmedQuery, { maxResults: 50 });
  }, [allCountries, popularCountries, trimmedQuery, isSearching, usesApiCatalog, loading, isEmpty, isBoundedCatalog]);

  const commitCode = useCallback(
    (code) => {
      const n = normalizeCountryCode(code) ?? '';
      if (!n) {
        if (allowEmpty) {
          onChange('');
        }
        return;
      }
      onChange(n);
      setQuery('');
      setOpen(false);
    },
    [allowEmpty, onChange],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!rootRef.current?.contains(/** @type {Node} */ (e.target))) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const inputDisplay = open ? (isSearching ? query : displayValue) : displayValue;
  const pickerDisabled = disabled || (usesApiCatalog && loading);

  const openPicker = useCallback((inputEl) => {
    if (pickerDisabled) {
      return;
    }
    setOpen(true);
    setQuery('');
    requestAnimationFrame(() => inputEl?.select?.());
  }, [pickerDisabled]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={combinedAriaDescribedBy}
        autoComplete="off"
        disabled={pickerDisabled}
        className={cn('h-11 rounded-md', inputClassName)}
        value={inputDisplay}
        placeholder={resolvedPlaceholder}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) {
            setOpen(true);
          }
          if (e.target.value.trim() === '' && allowEmpty) {
            onChange('');
          }
        }}
        onFocus={(e) => {
          openPicker(e.currentTarget);
        }}
        onClick={(e) => {
          if (!open) {
            openPicker(e.currentTarget);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
            return;
          }
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
            openPicker(e.currentTarget);
            return;
          }
          if (!open || suggestions.length === 0) {
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const row = suggestions[highlightIndex];
            if (row) {
              commitCode(row.code);
            }
          }
        }}
      />
      {open && !pickerDisabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 top-full mt-1 left-0 right-0 max-h-56 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1"
        >
          {allowEmpty ? (
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={!normalizedValue}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer font-medium',
                  !normalizedValue && 'bg-accent/60 text-accent-foreground',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitCode('')}
              >
                <LangText path="common.all_markets" />
              </button>
            </li>
          ) : null}
          {usesApiCatalog && loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              <LangText path="common.loading" />
            </li>
          ) : null}
          {usesApiCatalog && !loading && isEmpty ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              <LangText path="common.no_supported_countries" />
            </li>
          ) : null}
          {!usesApiCatalog || (!loading && !isEmpty) ? (
            <>
              {!isSearching ? (
                <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" aria-hidden>
                  <LangText
                    path={
                      isSupportedSource
                        ? 'common.configured_markets'
                        : isBoundedCatalog
                          ? 'common.configured_markets'
                          : 'common.popular_countries'
                    }
                  />
                </li>
              ) : (
                <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground" aria-hidden>
                  <LangText path="common.search_results" />
                </li>
              )}
              {suggestions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  <LangText path={isSupportedSource ? 'common.no_supported_country_found' : 'common.no_matching_country'} />
                </li>
              ) : (
                suggestions.map((entry, index) => (
                  <li key={entry.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={normalizedValue === entry.code}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer',
                        index === highlightIndex && 'bg-accent text-accent-foreground',
                        normalizedValue === entry.code && 'font-medium',
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commitCode(entry.code)}
                    >
                      <span className="truncate">{entry.label}</span>
                    </button>
                  </li>
                ))
              )}
              {showCatalogFooter ? (
                <li className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border/60 mt-1">
                  <LangText path="common.type_to_search_all_countries" />
                </li>
              ) : null}
            </>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
