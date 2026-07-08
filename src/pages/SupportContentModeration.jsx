import { MainLayout } from '@/components/layout/MainLayout';
import { PlatformStaffCountryScopeControl } from '@/components/admin/PlatformStaffCountryScopeControl';
import { SupportStaffNav } from '@/components/support/SupportStaffNav';
import AdminContentModeration from '@/pages/AdminContentModeration';

/**
 * Platform support content moderation in the main app layout (sidebar + header), not the admin shell.
 */
export default function SupportContentModeration() {
  return (
    <MainLayout>
      <SupportStaffNav />
      <div className="mb-6 flex justify-end">
        <PlatformStaffCountryScopeControl variant="panel" className="shrink-0 sm:max-w-xs" />
      </div>
      <AdminContentModeration />
    </MainLayout>
  );
}
