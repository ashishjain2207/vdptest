import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { registerLoadingCallback } from '@/services/api/client';

const LoadingContext = createContext({
  isLoading: false,
  setLoading: () => {},
  loadingCount: 0,
  resetLoading: () => {},
  markInitialLoadComplete: () => {},
});

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return ctx;
}

/** Delay before showing global loader (ms). Quick loads won't flash the loader. */
const LOADER_DELAY_MS = 300;

export function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [displayLoading, setDisplayLoading] = useState(false);
  const timeoutRef = useRef(null);
  const displayTimeoutRef = useRef(null);
  const hasCompletedInitialLoadRef = useRef(false);
  const MAX_LOADING_TIME = 30000; // 30 seconds max

  const resetLoading = useCallback(() => {
    setLoadingCount(0);
    setDisplayLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }
  }, []);

  const markInitialLoadComplete = useCallback(() => {
    hasCompletedInitialLoadRef.current = true;
    setDisplayLoading(false);
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }
  }, []);

  const setLoading = useCallback((loading) => {
    setLoadingCount((prev) => {
      const newCount = loading ? prev + 1 : Math.max(0, prev - 1);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (newCount > 0) {
        timeoutRef.current = setTimeout(() => {
          setLoadingCount(0);
          timeoutRef.current = null;
        }, MAX_LOADING_TIME);
      }

      return newCount;
    });
  }, []);

  // Show loader only on initial page load (reload). After first load completes, never show for in-app navigation.
  const prevLoadingCountRef = useRef(0);
  useEffect(() => {
    const prev = prevLoadingCountRef.current;
    prevLoadingCountRef.current = loadingCount;

    if (loadingCount === 0) {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }
      if (prev > 0) {
        hasCompletedInitialLoadRef.current = true;
      }
      setDisplayLoading(false);
      return;
    }
    // Already past initial load - never show loader for navigation/other actions
    if (hasCompletedInitialLoadRef.current) {
      return;
    }
    if (loadingCount === 1) {
      displayTimeoutRef.current = setTimeout(() => {
        displayTimeoutRef.current = null;
        setDisplayLoading(true);
      }, LOADER_DELAY_MS);
    } else {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }
      setDisplayLoading(true);
    }
    return () => {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
        displayTimeoutRef.current = null;
      }
    };
  }, [loadingCount]);

  // Register with API client to receive loading notifications
  useEffect(() => {
    const unregister = registerLoadingCallback(setLoading);
    return () => {
      unregister();
      if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
      if (displayTimeoutRef.current) {clearTimeout(displayTimeoutRef.current);}
    };
  }, [setLoading]);

  const isLoading = displayLoading;

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, loadingCount, resetLoading, markInitialLoadComplete }}>
      {children}
    </LoadingContext.Provider>
  );
}
