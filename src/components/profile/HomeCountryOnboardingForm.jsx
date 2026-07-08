import { useState } from 'react';
import { Button } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox';
import { normalizeCountryCode, setHomeCountryCode } from '@/lib/activeCountry';
import { putUserHomeCountry } from '@/services/profileService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * Shared home-country picker used on the onboarding page and in the required dialog.
 *
 * @param {{ onCompleted: () => void, idPrefix?: string }} props
 */
export function HomeCountryOnboardingForm({ onCompleted, idPrefix = 'home-country' }) {
  const { language } = useLanguage();
  const t = useT();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.user.user);
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fieldId = `${idPrefix}-required`;

  const handleSave = async () => {
    const normalized = normalizeCountryCode(country);
    if (!normalized) {
      setError(t('profile.chooseValidCountry'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      await putUserHomeCountry(normalized);
      setHomeCountryCode(normalized);
      if (currentUser) {
        dispatch(setUser({ ...currentUser, homeCountryCode: normalized }));
      }
      toast.success(t('profile.homeCountrySaved'));
      onCompleted();
    } catch (e) {
      toast.error(e?.message || t('toasts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          <LangText path="profile.home_country" />
          <span className="text-destructive" aria-hidden> *</span>
        </label>
        <CountryMarketCombobox
          id={fieldId}
          source="supported"
          language={language === 'DE' ? 'DE' : 'EN'}
          value={country}
          onChange={(code) => {
            setCountry(code);
            setError('');
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-err` : undefined}
        />
        {error ? (
          <p id={`${fieldId}-err`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="button" className="w-full" disabled={saving} onClick={() => void handleSave()}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <LangText path="common.saving" />
          </>
        ) : (
          <LangText path="profile.continue" />
        )}
      </Button>
    </div>
  );
}
