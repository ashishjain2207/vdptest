import { Label } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox.jsx';
import { useT } from '@/i18n';

/**
 * Market country picker for admin entity forms (defaults from Admin Scope on create).
 *
 * @param {{
 *   id: string,
 *   value: string,
 *   onChange: (code: string) => void,
 *   language: 'EN' | 'DE',
 *   allowEmpty?: boolean,
 * }} props
 */
export function AdminMarketCountryField({
  id,
  value,
  onChange,
  language,
  allowEmpty = true,
}) {
  const t = useT();

  return (
    <div className="space-y-2 max-w-xs">
      <Label htmlFor={id}>
        <LangText path="admin.market_country"  />
      </Label>
      <CountryMarketCombobox
        id={id}
        source="available"
        className="w-full"
        inputClassName="h-11 rounded-lg text-sm"
        aria-label={t('admin.market_country_aria')}
        language={language}
        value={value}
        allowEmpty={allowEmpty}
        onChange={onChange}
      />
    </div>
  );
}
