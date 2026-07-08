import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAccess } from '@/lib/platformAuth';
import { ACCESS_DENIED_REASON } from '@/lib/accessDeniedReasons';

/**
 * Requires platform staff: `VdpConnect.Admin` or `VdpConnect.Support` (see `getPlatformAuthFromToken` / API PlatformSupportStaff policy).
 * Others are redirected to `/access-denied`. Use inside `ProtectedRoute`.
 */
export function AdminRoute({ children }) {
  const location = useLocation();
  const { isPlatformStaff } = usePlatformAccess();

  if (!isPlatformStaff) {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{ from: location, reason: ACCESS_DENIED_REASON.PLATFORM_STAFF }}
      />
    );
  }

  return children;
}
