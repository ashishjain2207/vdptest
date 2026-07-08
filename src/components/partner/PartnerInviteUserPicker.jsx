import { useState, useEffect, useCallback } from 'react';
import { Button, Avatar, AvatarImage, AvatarFallback } from '@imriva/framework';
import { Loader2, X } from 'lucide-react';
import { searchUsers } from '@/services/suggestedPeopleService';
import { getInitials } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';
import { useAuth } from '@/contexts/AuthContext';
import { ClearableSearchInput } from '@/components/ui/ClearableSearchInput';

/**
 * Search profiles by handle/name and select one user for a partner invite.
 * @param {{
 *   value: { userId: string, handle: string, displayName: string, avatarUrl?: string | null } | null,
 *   onChange: (user: { userId: string, handle: string, displayName: string, avatarUrl?: string | null } | null) => void,
 *   disabled?: boolean,
 * }} props
 */
export function PartnerInviteUserPicker({ value, onChange, disabled }) {
  const { user: authUser } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(term, 1, 15);
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
  }, [q, authUser?.userId]);

  const pick = useCallback(
    (row) => {
      const userId = String(row.userId ?? row.UserId ?? '');
      const handle = String(row.handle ?? row.Handle ?? '');
      const displayName = String(row.displayName ?? row.DisplayName ?? handle);
      const avatarUrl = row.avatarUrl ?? row.AvatarUrl ?? null;
      if (!userId) {
        return;
      }
      onChange({ userId, handle, displayName, avatarUrl });
      setQ('');
      setResults([]);
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={value.avatarUrl || undefined} alt="" />
          <AvatarFallback className="text-xs">{getInitials(value.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{value.displayName}</div>
          <div className="text-xs text-muted-foreground truncate">@{value.handle}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={disabled}
          onClick={() => onChange(null)}
          aria-label="Clear selected user"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ClearableSearchInput
        inputClassName="h-11 rounded-lg"
        placeholder="Search by name or @handle"
        value={q}
        disabled={disabled}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search users by name or handle"
        clearAriaLabel="Clear search"
        dataTestId="partner-invite-user-search"
      />
      {loading ? (
        <div className="flex items-center gap-1 py-0.5" aria-busy="true">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      {q.trim().length >= 2 && !loading && results.length > 0 && (
        <ul className="rounded-lg border border-border max-h-52 overflow-auto bg-card divide-y divide-border">
          {results.map((row) => {
            const uid = String(row.userId ?? row.UserId ?? '');
            const dn = String(row.displayName ?? row.DisplayName ?? '');
            const h = String(row.handle ?? row.Handle ?? '');
            const av = String(row.avatarUrl ?? row.AvatarUrl ?? '');
            return (
              <li key={uid}>
                <button
                  type="button"
                  disabled={disabled}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
                  aria-label={`Select user ${dn || h || uid}`}
                  onClick={() => pick(row)}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={av || undefined} alt="" />
                    <AvatarFallback className="text-xs">{(dn || h).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{dn || h}</div>
                    <div className="text-xs text-muted-foreground truncate">{h ? `@${h}` : uid}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {q.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          <LangText path="partners.no_users_found"  />
        </p>
      )}
    </div>
  );
}
