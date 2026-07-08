import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isAppInsightsEnabled, trackPageView } from '@/services/telemetry/appInsights.js';
import { buildSanitizedPageViewTelemetry } from '@/services/telemetry/pageViewTelemetry.js';

export function AppInsightsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isAppInsightsEnabled() || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const { name, uri } = buildSanitizedPageViewTelemetry({
      origin: window.location.origin,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      title: document.title,
    });

    void trackPageView({ name, uri });
  }, [location.hash, location.pathname, location.search]);

  return null;
}
