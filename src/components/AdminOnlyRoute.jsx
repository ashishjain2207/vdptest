import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAccess } from '@/lib/platformAuth';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';
import { ACCESS_DENIED_REASON } from '@/lib/accessDeniedReasons';

/**
 * Restricts routes to full platform administrators (not support staff).
 */
export function AdminOnlyRoute({ children }) {
  const location = useLocation();
  const { isPlatformAdmin, isPlatformStaff } = usePlatformAccess();

  if (isPlatformAdmin) {
    return children;
  }

  if (isPlatformStaff) {
    return (
      <Navigate
        to={PLATFORM_SUPPORT_INBOX_PATH}
        replace
        state={{ from: location, reason: 'platformAdminOnly' }}
      />
    );
  }

  return (
    <Navigate
      to="/access-denied"
      replace
      state={{ from: location, reason: ACCESS_DENIED_REASON.PLATFORM_ADMIN }}
    />
  );
}
