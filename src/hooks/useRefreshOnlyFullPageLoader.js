import { useState, useRef, useCallback } from 'react';
import { isNavigationReload } from '@/lib/navigationReload';

/**
 * Drives a full-page loading state only when the browser performed a full reload (e.g. F5).
 * Clears after the first completed fetch so in-app navigations never show this loader.
 */
export function useRefreshOnlyFullPageLoader() {
  const [showLoader, setShowLoader] = useState(() => isNavigationReload());
  const initialFetchDoneRef = useRef(false);

  const endInitialFetch = useCallback(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      setShowLoader(false);
    }
  }, []);

  return { showRefreshLoader: showLoader, endInitialFetch };
}
