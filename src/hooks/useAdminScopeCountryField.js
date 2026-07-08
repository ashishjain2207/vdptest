import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeCountryCode } from '@/lib/activeCountry.js';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';

/** @param {string | null | undefined} raw */
function normalizeFieldValue(raw) {
  return normalizeCountryCode(raw ?? '') ?? '';
}

/**
 * Country field state for admin create/edit forms.
 * On create, defaults from Admin Scope and follows scope changes until the user edits the field.
 *
 * @param {{ isCreate: boolean }} options
 */
export function useAdminScopeCountryField({ isCreate }) {
  const { country: adminScopeCountry } = useAdminScopeCountry();
  const touchedRef = useRef(false);
  const [countryCode, setCountryCodeState] = useState(() =>
    isCreate ? normalizeFieldValue(adminScopeCountry) : '',
  );

  useEffect(() => {
    if (!isCreate || touchedRef.current) {
      return;
    }
    setCountryCodeState(normalizeFieldValue(adminScopeCountry));
  }, [isCreate, adminScopeCountry]);

  /** @param {string} value */
  const setCountryCode = (value) => {
    touchedRef.current = true;
    setCountryCodeState(normalizeFieldValue(value));
  };

  /** @param {string | null | undefined} value */
  const setCountryCodeFromApi = useCallback((value) => {
    setCountryCodeState(normalizeFieldValue(value));
  }, []);

  return {
    countryCode,
    setCountryCode,
    setCountryCodeFromApi,
    adminScopeCountry: adminScopeCountry ?? '',
  };
}
