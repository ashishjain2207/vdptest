import { LangText } from '@/components/ui/LangText';
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox.jsx';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { usePlatformAccess } from '@/lib/platformAuth';
import { cn } from '@/lib/utils';

/**
 * Country scope picker for platform staff (admin + support) investigating content by market.
 *
 * @param {{
 *   className?: string,
 *   comboboxClassName?: string,
 *   inputClassName?: string,
 *   showLabel?: boolean,
 *   variant?: 'inline' | 'panel',
 *   allowAllMarkets?: boolean,
 * }} props
 */
export function PlatformStaffCountryScopeControl({
  className,
  comboboxClassName,
  inputClassName = 'h-9 text-sm',
  showLabel = true,
  variant = 'inline',
  allowAllMarkets = true,
}) {
  const { isPlatformStaff, isSupportOnly } = usePlatformAccess();
  const { country, setCountry } = useAdminScopeCountry();
  const { language } = useLanguage();
  const t = useT();
  const scopeAriaLabel = isSupportOnly
    ? t('admin.support_country_scope_aria')
    : t('admin.admin_country_scope_aria');

  if (!isPlatformStaff) {
    return null;
  }

  const scopeLabelPath = isSupportOnly ? 'admin.country_scope' : 'admin.admin_scope';

  if (variant === 'panel') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-card px-4 py-3 shadow-sm w-full sm:w-auto sm:min-w-[16rem]',
          className,
        )}
      >
        <div className="space-y-2">
          {showLabel ? (
            <p className="text-sm font-medium text-foreground">
              <LangText path={scopeLabelPath} />
            </p>
          ) : null}
          <CountryMarketCombobox
            className={cn('w-full', comboboxClassName)}
            inputClassName={cn('h-10 rounded-lg text-sm', inputClassName)}
            aria-label={scopeAriaLabel}
            language={language === 'DE' ? 'DE' : 'EN'}
            source="supported"
            value={country ?? ''}
            allowEmpty={allowAllMarkets}
            showFooterHint={false}
            onChange={setCountry}
          />
        </div>
      </div>
    );
  }

  return (
    <label
      className={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap',
        className,
      )}
    >
      {showLabel ? (
        <span className="hidden sm:inline">
          <LangText path={scopeLabelPath} />
        </span>
      ) : null}
      <CountryMarketCombobox
        className={cn('w-[min(100%,14rem)] sm:w-52', comboboxClassName)}
        inputClassName={inputClassName}
        aria-label={scopeAriaLabel}
        language={language === 'DE' ? 'DE' : 'EN'}
        source="supported"
        value={country ?? ''}
        allowEmpty={allowAllMarkets}
        showFooterHint={false}
        onChange={setCountry}
      />
    </label>
  );
}
