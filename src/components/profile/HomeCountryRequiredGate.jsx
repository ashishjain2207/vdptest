import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { getAccessToken, getPlatformAuthFromToken } from '@/services';
import { profileHasHomeCountry, buildOnboardingRedirectUrl } from '@/lib/homeCountryOnboarding';
import { isHomeCountryRequiredPath } from '@/lib/homeCountryGatePaths';

/**
 * Redirects signed-in users without a home country to onboarding (platform staff exempt).
 */
export function HomeCountryRequiredGate({ children }) {
  const { pathname } = useLocation();
  const { maintenanceMode } = useMaintenanceMode();
  const user = useAppSelector((s) => s.user.user);
  const loading = useAppSelector((s) => s.user.loading);
  const sessionUserId = user?.loggedIn ? (user?.userId ?? null) : null;

  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const platformAuth = token ? getPlatformAuthFromToken(token) : null;
  const isPlatformStaff = Boolean(platformAuth?.isPlatformStaff);

  const hasHomeCountry = profileHasHomeCountry(user);

  const onGatedRoute = isHomeCountryRequiredPath(pathname);

  const mustBlock = useMemo(
    () =>
      maintenanceMode !== true
      && onGatedRoute
      && Boolean(sessionUserId)
      && !loading
      && !isPlatformStaff
      && !hasHomeCountry,
    [
      maintenanceMode,
      onGatedRoute,
      sessionUserId,
      loading,
      isPlatformStaff,
      hasHomeCountry,
    ],
  );

  if (!mustBlock) {
    return children;
  }

  return <Navigate to={buildOnboardingRedirectUrl(pathname)} replace />;
}
