import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Avatar, AvatarImage, AvatarFallback, Label } from '@imriva/framework';
import { Loader2, X } from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { useT, useTParams } from '@/i18n';
import { PartnerAdminUsersPicker } from '@/components/partner/PartnerAdminUsersPicker';
import {
  adminAddPartnerAdministrator,
  adminRemovePartnerAdministrator,
} from '@/services/partnerService';
import { getInitials, cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Platform admin: view, add, and remove partner administrators on the edit partner page.
 * @param {{
 *   organizationId: string,
 *   administrators: Array<{ userId: string, handle?: string, displayName?: string, avatarUrl?: string | null }>,
 *   disabled?: boolean,
 *   onPartnerUpdated: (partner: Record<string, unknown>) => void,
 *   partnerCountryCode?: string | null,
 *   countryChangePending?: boolean,
 *   className?: string,
 * }} props
 */
export function PartnerAdministratorsEditor({
  organizationId,
  administrators,
  disabled,
  onPartnerUpdated,
  partnerCountryCode,
  countryChangePending = false,
  className,
}) {
  const t = useT();
  const tParams = useTParams();
  const list = Array.isArray(administrators) ? administrators.filter((u) => u?.userId) : [];
  const [busyUserId, setBusyUserId] = useState(/** @type {string | null} */ (null));
  const [adding, setAdding] = useState(false);
  const adminActionsDisabled = disabled || countryChangePending;

  const applyUpdatedPartner = useCallback(
    (updated) => {
      if (updated && typeof updated === 'object') {
        onPartnerUpdated(updated);
      }
    },
    [onPartnerUpdated],
  );

  const handleAdd = async (/** @type {{ userId: string }} */ user) => {
    if (!user?.userId || !organizationId || adminActionsDisabled) {
      return;
    }
    if (list.some((u) => u.userId === user.userId)) {
      toast.message(t('admin.adminAlreadyPartnerAdmin'));
      return;
    }
    setAdding(true);
    try {
      const updated = await adminAddPartnerAdministrator(organizationId, user.userId);
      applyUpdatedPartner(updated);
      toast.success(t('admin.partnerAdminAdded'));
    } catch (err) {
      toast.error(err?.message || t('admin.failedAddAdministrator'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (/** @type {string} */ userId) => {
    if (!userId || !organizationId || adminActionsDisabled) {
      return;
    }
    if (list.length <= 1) {
      toast.error(t('admin.minOneAdministrator'));
      return;
    }
    setBusyUserId(userId);
    try {
      const updated = await adminRemovePartnerAdministrator(organizationId, userId);
      applyUpdatedPartner(updated);
      toast.success(t('admin.partnerAdminRemoved'));
    } catch (err) {
      toast.error(err?.message || t('admin.failedRemoveAdministrator'));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-sm font-medium">
          <LangText path="partners.partner_administrators"  />
        </Label>
      </div>

      {list.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Partner administrators">
          {list.map((u) => {
            const displayName = String(u.displayName ?? u.handle ?? u.userId);
            const handle = String(u.handle ?? '').trim();
            const isBusy = busyUserId === u.userId;
            const canRemove = list.length > 1 && !adminActionsDisabled && !adding;
            return (
              <li key={u.userId}>
                <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 pl-1.5 pr-1 py-1 max-w-full">
                  <Link
                    to={`/profile/${encodeURIComponent(u.userId)}`}
                    className="inline-flex items-center gap-2 min-w-0 hover:opacity-90"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={u.avatarUrl || undefined} alt="" />
                      <AvatarFallback className="text-[10px]">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm min-w-0 pr-1">
                      <span className="font-medium text-foreground block truncate max-w-[160px] sm:max-w-[200px]">
                        {displayName}
                      </span>
                      {handle ? (
                        <span className="text-xs text-muted-foreground block truncate max-w-[160px] sm:max-w-[200px]">
                          @{handle}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled={!canRemove || isBusy}
                    aria-label={tParams('admin.removeAdminAria', { name: displayName })}
                    title={
                      list.length <= 1
                        ? t('admin.atLeastOneAdminRequired')
                        : t('admin.removeAsAdministrator')
                    }
                    onClick={() => void handleRemove(u.userId)}
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          <LangText path="partners.no_partner_administrators_yet_search_below_to_add_one"
          />
        </p>
      )}

      {countryChangePending ? (
        <p className="text-sm text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
          <LangText path="partners.save_the_new_partner_country_first_administrators_who_do_not"
          />
        </p>
      ) : null}

      <div className={cn(adding && 'pointer-events-none opacity-60')}>
        <PartnerAdminUsersPicker
          value={[]}
          partnerCountryCode={partnerCountryCode}
          disabled={adminActionsDisabled || adding}
          onChange={(users) => {
            const last = users[users.length - 1];
            if (last) {
              void handleAdd(last);
            }
          }}
        />
        {adding ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2" aria-live="polite">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            <LangText path="partners.adding_administrator"  />
          </div>
        ) : null}
      </div>
    </div>
  );
}
