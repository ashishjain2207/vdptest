import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { getAccessToken, getPlatformAuthFromToken, hasSession } from '@/services';

/**
 * Public auth/legal routes reachable during maintenance for everyone (same as unauthenticated).
 * Platform admins and support users bypass maintenance entirely and may use any route.
 * Signed-in non-staff only see `/maintenance` except these paths (and OAuth callback).
 * When maintenance turns on while users are active, a short grace period shows a warning banner before redirect.
 * (no app-wide spinner on `/`). Signed-in users wait briefly until the flag is known.
 */
const ALLOWED_UNDER_MAINTENANCE = new Set([
  '/login',
  '/signup',
  '/callback',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/terms',
  '/privacy',
  '/cookie',
  '/accessibility',
  '/support',
]);

export function MaintenanceRouteGuard() {
  const { maintenanceMode, gracePeriodActive } = useMaintenanceMode();
  const location = useLocation();
  const pathname = location.pathname.split('?')[0] || '';

  const token = getAccessToken();
  const sessionOk = Boolean(token) && hasSession();
  const isPlatformStaff = Boolean(token && getPlatformAuthFromToken(token).isPlatformStaff);

  if (maintenanceMode === null) {
    if (ALLOWED_UNDER_MAINTENANCE.has(pathname)) {
      return <Outlet />;
    }
    if (!sessionOk) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (maintenanceMode !== true || isPlatformStaff) {
    return <Outlet />;
  }

  if (ALLOWED_UNDER_MAINTENANCE.has(pathname)) {
    return <Outlet />;
  }

  // Not signed in → login first; new sign-ins are blocked on the login page for non-staff.
  if (!sessionOk) {
    return <Navigate to="/login" replace state={{ from: location, maintenance: true }} />;
  }

  if (gracePeriodActive && pathname !== '/maintenance') {
    return <Outlet />;
  }

  return <Navigate to="/maintenance" replace state={{ from: location }} />;
}
