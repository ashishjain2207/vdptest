import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { getAvailableCountries, getSupportedCountries } from '@/services/countriesService.js';
import { getMarketCountryLabel } from '@/lib/marketCountryCodes.js';

/** @typedef {'supported' | 'available'} CountryPickerSource */

/**
 * @param {SupportedCountry[]} countries
 * @param {'EN' | 'DE'} language
 * @returns {{ code: string, label: string }[]}
 */
export function mapCountriesToPickerEntries(countries, language) {
  const locale = language === 'DE' ? 'de' : 'en';
  return [...countries]
    .map((country) => {
      const label = country.name || getMarketCountryLabel(country.code, language);
      return { code: country.code, label };
    })
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }));
}

/**
 * Loads backend country catalog for pickers.
 *
 * @param {CountryPickerSource | null | undefined} source
 */
export function useCountryPickerCatalog(source) {
  const { language } = useLanguage();
  const t = useT();
  const lang = language === 'DE' ? 'DE' : 'EN';
  const [countries, setCountries] = useState(/** @type {import('@/services/countriesService.js').SupportedCountry[]} */ ([]));
  const [loading, setLoading] = useState(Boolean(source));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!source) {
      setCountries([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetcher = source === 'available' ? getAvailableCountries : getSupportedCountries;
    fetcher()
      .then((list) => {
        if (!cancelled) {
          setCountries(list);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setCountries([]);
          setError(e?.message?.trim() ? e.message : t('common.failed_to_load_countries'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, t]);

  const catalog = useMemo(
    () => mapCountriesToPickerEntries(countries, lang),
    [countries, lang],
  );

  return {
    catalog,
    loading,
    error,
    isEmpty: !loading && catalog.length === 0,
  };
}
