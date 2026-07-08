import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

/**
 * Support/feedback category picker: chevron when empty; clear (X) when selected — X clears and reopens the list.
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   onBlur?: () => void,
 *   options: Array<{ value: string, labelKey: string }>,
 *   hasError?: boolean,
 * }} props
 */
export function SupportCategorySelect({
  id: idProp,
  value,
  onChange,
  onBlur,
  options,
  hasError = false,
}) {
  const t = useT();
  const autoId = useId();
  const triggerId = idProp ?? `support-category-${autoId}`;
  const listId = `${triggerId}-list`;
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const label = selected ? t(selected.labelKey) : null;
  const placeholder = t('support.selectCategoryPlaceholder');
  const hasValue = Boolean(value);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(/** @type {Node} */ (e.target))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  const openList = () => setOpen(true);

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setOpen(true);
  };

  const pick = (next) => {
    onChange(next);
    setOpen(false);
    onBlur?.();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          'flex h-11 w-full items-center rounded-lg border bg-card text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30',
          hasError ? 'border-destructive' : 'border-border',
          hasValue ? 'pl-3 pr-10' : 'px-3 pr-10',
        )}
        onClick={() => (open ? close() : openList())}
      >
        <span className={cn('flex-1 truncate', !label && 'text-muted-foreground')}>{label || placeholder}</span>
      </button>

      {hasValue ? (
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          aria-label={t('support.changeCategory')}
          onMouseDown={handleClear}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      ) : (
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card p-1 text-sm shadow-md"
        >
          {options.map((opt) => {
            const optLabel = t(opt.labelKey);
            const isSelected = value === opt.value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-3 text-left outline-none hover:bg-rose-50',
                    isSelected && 'bg-rose-50 font-medium',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(opt.value);
                  }}
                >
                  {isSelected ? (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-4 w-4 text-foreground" aria-hidden />
                    </span>
                  ) : null}
                  {optLabel}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
