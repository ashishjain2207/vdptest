import { createContext, useContext, useEffect, useState } from 'react';
import { getFeatureFlags } from '@/services/featureFlagsService';

const FeatureFlagsContext = createContext({
  audioVideoCallEnabled: false,
  contentReportsEnabled: false,
  loading: true,
});

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState({
    audioVideoCallEnabled: false,
    contentReportsEnabled: false,
    loading: true,
  });

  const applyFlags = (f) => ({
    audioVideoCallEnabled: f.audioVideoCallEnabled,
    contentReportsEnabled: f.contentReportsEnabled,
    loading: false,
  });

  const fetchFlags = () => {
    getFeatureFlags()
      .then((f) =>
        setFlags((prev) => ({
          ...prev,
          ...applyFlags(f),
        })),
      )
      .catch(() =>
        setFlags((prev) => ({
          ...prev,
          audioVideoCallEnabled: false,
          contentReportsEnabled: false,
          loading: false,
        })),
      );
  };

  useEffect(() => {
    let mounted = true;
    getFeatureFlags()
      .then((f) => {
        if (!mounted) { return; }
        setFlags(applyFlags(f));
      })
      .catch(() => {
        if (!mounted) { return; }
        setFlags({
          audioVideoCallEnabled: false,
          contentReportsEnabled: false,
          loading: false,
        });
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onFocus = () => fetchFlags();
    const onScopeChange = () => fetchFlags();
    window.addEventListener('focus', onFocus);
    window.addEventListener('imriva-admin-scope-country-changed', onScopeChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('imriva-admin-scope-country-changed', onScopeChange);
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
