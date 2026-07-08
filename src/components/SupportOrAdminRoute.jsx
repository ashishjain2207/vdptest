import { AdminRoute } from '@/components/AdminRoute';

/**
 * Allows platform support staff and platform admins (not regular users).
 * Use for staff tools under `/support/*` that must stay outside the admin shell.
 */
export function SupportOrAdminRoute({ children }) {
  return <AdminRoute>{children}</AdminRoute>;
}
