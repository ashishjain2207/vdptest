import { Navigate } from 'react-router-dom';
import { usePlatformAccess } from '@/lib/platformAuth';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';
import AdminDashboard from '@/pages/AdminDashboard';

/**
 * Support staff land on the inbox; platform admins see the dashboard.
 */
export function AdminStaffHomeRedirect() {
  const { isSupportOnly } = usePlatformAccess();
  if (isSupportOnly) {
    return <Navigate to={PLATFORM_SUPPORT_INBOX_PATH} replace />;
  }
  return <AdminDashboard />;
}
