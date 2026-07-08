import { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext(undefined);

const STORAGE_KEY = 'vdpconnect_language';

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'EN') { return 'EN'; }
    if (stored === 'DE') { return 'DE'; }
  } catch (_e) { /* ignore */ }
  return 'DE';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  const setLanguage = useCallback((lang) => {
    if (lang !== 'EN' && lang !== 'DE') { return; }
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_e) { /* ignore */ }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

const DEFAULT_LANGUAGE = { language: 'DE', setLanguage: () => {} };

export function useLanguage() {
  const context = useContext(LanguageContext);
  // Fallback when outside provider (e.g. during initial mount, hot reload, or edge cases)
  return context ?? DEFAULT_LANGUAGE;
}
