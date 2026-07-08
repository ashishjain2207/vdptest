import { Label } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox.jsx';
import { FieldError } from '@/components/ui/FieldError';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Primary country picker for partner create/edit with searchable country suggestions.
 *
 * @param {{
 *   id: string,
 *   value: string,
 *   onChange: (code: string) => void,
 *   language: 'EN' | 'DE',
 *   error?: string,
 * }} props
 */
export function PartnerPrimaryCountryField({ id, value, onChange, language, error }) {
  const errorId = `${id}-err`;
  const t = useT();

  return (
    <div className="space-y-2 max-w-md">
      <Label htmlFor={id}>
        <LangText path="partners.primary_country"  /> <span className="text-destructive">*</span>
      </Label>
      <CountryMarketCombobox
        id={id}
        source="available"
        className="w-full"
        inputClassName={cn('h-11 rounded-lg text-sm', error && 'border-destructive')}
        aria-label={t('partners.primary_country_aria')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        language={language}
        value={value}
        allowEmpty={false}
        onChange={onChange}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
