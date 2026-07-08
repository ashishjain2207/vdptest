import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button, Avatar, AvatarImage, AvatarFallback, Label } from '@imriva/framework';
import { Loader2, X } from 'lucide-react';
import { searchUsers } from '@/services/suggestedPeopleService';
import { getInitials, cn } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, useT, useTParams } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';
import { FieldError } from '@/components/ui/FieldError';

/**
 * @param {string | undefined | null} searchQuery
 * @param {'EN' | 'DE'} [language='EN']
 * @param {{ required?: boolean, selectedCount?: number }} [options]
 * @returns {string | null}
 */
export function getPartnerAdminUsersPickerValidationMessage(
  searchQuery,
  language = 'EN',
  { required = false, selectedCount = 0 } = {},
) {
  const lang = language === 'DE' ? 'DE' : 'EN';
  const term = String(searchQuery ?? '').trim();
  if (term.length > 0) {
    if (term.length < 2) {
      return t(lang, 'validation.partnerAdminSearchMin');
    }
    return t(lang, 'validation.partnerAdminSelectOrClear');
  }
  if (required && selectedCount === 0) {
    return t(lang, 'validation.partnerAdminRequired');
  }
  return null;
}

/**
 * Search profiles and add multiple users as initial partner admins (Identity user ids for the API).
 * @param {{
 *   id?: string,
 *   value: Array<{ userId: string, handle: string, displayName: string, avatarUrl?: string | null }>,
 *   onChange: (users: Array<{ userId: string, handle: string, displayName: string, avatarUrl?: string | null }>) => void,
 *   disabled?: boolean,
 *   className?: string,
 *   error?: string,
 *   required?: boolean,
 *   required?: boolean,
 *   partnerCountryCode?: string | null,
 *   onSearchQueryChange?: (query: string) => void,
 * }} props
 * @param {import('react').Ref<{ validate: () => string | null }>} ref
 */
export const PartnerAdminUsersPicker = forwardRef(function PartnerAdminUsersPicker(
  { id, value, onChange, disabled, className, error, required = false, partnerCountryCode, onSearchQueryChange },
  ref,
) {
  const { language } = useLanguage();
  const tLabel = useT();
  const tr = useTParams();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const { user: authUser } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(false);
  const normalizedPartnerCountry = String(partnerCountryCode ?? '').trim().toUpperCase().slice(0, 2);
  const hasPartnerCountry = normalizedPartnerCountry.length === 2;

  const updateQuery = useCallback(
    (next) => {
      setQ(next);
      onSearchQueryChange?.(next);
    },
    [onSearchQueryChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      validate() {
        return getPartnerAdminUsersPickerValidationMessage(q, lang, {
          required,
          selectedCount: value.length,
        });
      },
    }),
    [q, lang, required, value.length],
  );

  useEffect(() => {
    let cancelled = false;
    const term = q.trim();
    if (term.length < 2 || !hasPartnerCountry) {
      setResults([]);
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(term, 1, 15, { countryCode: normalizedPartnerCountry });
        const raw = res?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const filtered = authUser?.userId
          ? list.filter((row) => String(row.userId ?? row.UserId ?? '') !== authUser.userId)
          : list;
        if (!cancelled) {
          setResults(filtered);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, authUser?.userId, hasPartnerCountry, normalizedPartnerCountry]);

  const addUser = useCallback(
    (row) => {
      const userId = String(row.userId ?? row.UserId ?? '');
      const handle = String(row.handle ?? row.Handle ?? '');
      const displayName = String(row.displayName ?? row.DisplayName ?? handle);
      const avatarUrl = row.avatarUrl ?? row.AvatarUrl ?? null;
      if (!userId || value.some((u) => u.userId === userId)) {
        return;
      }
      onChange([...value, { userId, handle, displayName, avatarUrl }]);
      updateQuery('');
      setResults([]);
    },
    [onChange, updateQuery, value],
  );

  const removeAt = useCallback(
    (userId) => {
      onChange(value.filter((u) => u.userId !== userId));
    },
    [onChange, value],
  );

  const trimmedQ = q.trim();
  const showTypeMoreHint = trimmedQ.length > 0 && trimmedQ.length < 2;
  const showNoResults = trimmedQ.length >= 2 && !loading && results.length === 0;
  const errorId = id ? `${id}-err` : undefined;

  return (
    <div className={cn('space-y-2 min-w-0', className)}>
      <Label htmlFor={id}>
        <LangText path="partners.partner_administrators" />
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <ClearableSearchInput
        id={id}
        inputClassName={cn('h-11 rounded-lg', error && 'border-destructive')}
        placeholder={tLabel('admin.searchAddMembers')}
        value={q}
        disabled={disabled || !hasPartnerCountry}
        onChange={(e) => updateQuery(e.target.value)}
        aria-label={tLabel('admin.searchUsersForAdmins')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        clearAriaLabel={tLabel('common.clearSearch')}
        dataTestId="partner-admin-user-search"
      />
      <FieldError id={errorId ?? 'partner-admin-users-err'} message={error} />
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2 pt-1" aria-label={tLabel('admin.selectedPartnerAdmins')}>
          {value.map((u) => (
            <li
              key={u.userId}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 pl-1.5 pr-1 py-1 max-w-full"
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={u.avatarUrl || undefined} alt="" />
                <AvatarFallback className="text-[10px]">{getInitials(u.displayName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm truncate min-w-0">{u.displayName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={disabled}
                onClick={() => removeAt(u.userId)}
                aria-label={tr('admin.removeFromAdmins', { name: u.displayName })}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {loading ? (
        <div className="flex items-center gap-1 py-0.5" aria-busy="true">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      {showTypeMoreHint ? (
        <p className="text-sm text-muted-foreground py-1">
          <LangText path="partners.type_at_least_2_characters_to_search" />
        </p>
      ) : null}
      {trimmedQ.length >= 2 && !loading && results.length > 0 && (
        <ul className="rounded-lg border border-border max-h-52 overflow-auto bg-card divide-y divide-border">
          {results.map((row) => {
            const uid = String(row.userId ?? row.UserId ?? '');
            const dn = String(row.displayName ?? row.DisplayName ?? '');
            const h = String(row.handle ?? row.Handle ?? '');
            const av = String(row.avatarUrl ?? row.AvatarUrl ?? '');
            const already = value.some((u) => u.userId === uid);
            return (
              <li key={uid}>
                <button
                  type="button"
                  disabled={disabled || already || !uid}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label={
                    already
                      ? tr('admin.alreadyAddedAria', { name: dn || h })
                      : tr('admin.addAsPartnerAdmin', { name: dn || h || uid })
                  }
                  onClick={() => addUser(row)}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={av || undefined} alt="" />
                    <AvatarFallback className="text-xs">{(dn || h).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{dn || h}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {already ? (
                        <LangText path="partners.already_added" />
                      ) : h ? (
                        `@${h}`
                      ) : (
                        uid
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {showNoResults ? (
        <p className={cn('text-sm py-2', error ? 'text-destructive' : 'text-muted-foreground')}>
          {hasPartnerCountry
            ? tr('partners.noUsersInCountry', { country: normalizedPartnerCountry })
            : tLabel('partners.setCountryBeforeSearch')}
        </p>
      ) : null}
    </div>
  );
});

PartnerAdminUsersPicker.displayName = 'PartnerAdminUsersPicker';
