import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LangText } from '@/components/ui/LangText';
import { PlatformStaffCountryScopeControl } from '@/components/admin/PlatformStaffCountryScopeControl';
import { SupportStaffNav } from '@/components/support/SupportStaffNav';
import AdminFeedbackSupport from '@/pages/AdminFeedbackSupport';

/**
 * Platform support inbox in the main app layout (sidebar + header), not the admin shell.
 */
export default function SupportInbox() {
  const location = useLocation();
  const openSupportInquiryId = location.state?.openSupportInquiryId ?? null;

  return (
    <MainLayout>
      <SupportStaffNav />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="partner-admin-heading text-3xl font-bold tracking-tight text-foreground shrink-0">
          <LangText path="nav.supportInbox"  />
        </h1>
        <PlatformStaffCountryScopeControl variant="panel" className="shrink-0 sm:max-w-xs" />
      </div>
      <AdminFeedbackSupport initialDetailId={openSupportInquiryId} />
    </MainLayout>
  );
}
