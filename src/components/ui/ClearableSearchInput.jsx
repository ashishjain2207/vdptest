import { Search, X } from 'lucide-react';
import { Input, Button } from '@imriva/framework';
import { cn } from '@/lib/utils';

/**
 * Optional leading search icon + text input + clear (X) when value is non-empty (Explore page pattern).
 * Set showSearchIcon={false} for a plain field that only needs a clear control.
 * Pass `dataTestId` for stable E2E selectors (also sets `data-testid` on the input).
 */
export function ClearableSearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  className,
  inputClassName,
  searchIconClassName,
  clearAriaLabel = 'Clear search',
  disabled,
  showSearchIcon = true,
  /** @type {string | undefined} Stable test id for the input (E2E). */
  dataTestId,
  ...inputProps
}) {
  const str = String(value ?? '');
  const hasValue = str.trim().length > 0;
  const resolvedAriaLabel =
    inputProps['aria-label'] ??
    (typeof placeholder === 'string'
      ? placeholder.replace(/[.….]+$/u, '').trim()
      : undefined) ??
    'Search';

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Always sync controlled inputs via onChange; onClear is for extra cleanup (e.g. header suggestions).
    onChange?.({ target: { value: '' } });
    onClear?.();
  };

  return (
    <div className={cn('relative', className)} data-testid={dataTestId ? `${dataTestId}-root` : undefined}>
      {showSearchIcon ? (
        <Search
          aria-hidden
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10',
            searchIconClassName ?? 'left-3 w-4 h-4',
          )}
        />
      ) : null}
      <Input
        {...inputProps}
        aria-label={resolvedAriaLabel}
        disabled={disabled}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={dataTestId ?? inputProps['data-testid']}
        className={cn(hasValue ? 'pr-10' : null, showSearchIcon && 'pl-10', inputClassName)}
      />
      {hasValue && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 z-10"
          onMouseDown={(e) => {
            // Keep focus on the input so blur doesn’t run before clear; avoids stale dropdown/state.
            e.preventDefault();
          }}
          onClick={handleClear}
          aria-label={clearAriaLabel}
          data-testid={dataTestId ? `${dataTestId}-clear` : undefined}
        >
          <X className="w-4 h-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
