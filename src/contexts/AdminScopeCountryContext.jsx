import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeCountryCode } from '@/lib/activeCountry.js';
import {
  ADMIN_SCOPE_COUNTRY_STORAGE_KEY,
  getAdminScopeCountryCode,
  setAdminScopeCountryCode as persistAdminScope,
} from '@/lib/adminScopeCountry.js';

const AdminScopeCountryContext = createContext(null);

/** @returns {string | null} ISO code, or null for all markets. */
function readInitialScope() {
  return getAdminScopeCountryCode();
}

export function AdminScopeCountryProvider({ children }) {
  const [country, setCountryState] = useState(readInitialScope);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== ADMIN_SCOPE_COUNTRY_STORAGE_KEY || typeof window === 'undefined') {
        return;
      }
      setCountryState(getAdminScopeCountryCode());
    };
    const onCustom = () => {
      setCountryState(getAdminScopeCountryCode());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('imriva-admin-scope-country-changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('imriva-admin-scope-country-changed', onCustom);
    };
  }, []);

  /** @param {string} code - ISO alpha-2, or empty string for all markets. */
  const setCountry = useCallback((code) => {
    const n = normalizeCountryCode(code ?? '');
    setCountryState(n);
    persistAdminScope(n);
  }, []);

  const value = useMemo(() => ({ country, setCountry }), [country, setCountry]);

  return (
    <AdminScopeCountryContext.Provider value={value}>
      {children}
    </AdminScopeCountryContext.Provider>
  );
}

export function useAdminScopeCountry() {
  const ctx = useContext(AdminScopeCountryContext);
  if (!ctx) {
    throw new Error('useAdminScopeCountry must be used within AdminScopeCountryProvider');
  }
  return ctx;
}
