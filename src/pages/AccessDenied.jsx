import { Link, useLocation } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LangText } from '@/components/ui/LangText';
import { Button } from '@imriva/framework';
import { ACCESS_DENIED_REASON } from '@/lib/accessDeniedReasons';

/**
 * Shown when an authenticated user hits a route they are not allowed to use (e.g. platform admin pages).
 */
export default function AccessDenied() {
  const location = useLocation();
  const reason = location.state?.reason;

  let message;
  if (reason === ACCESS_DENIED_REASON.PLATFORM_ADMIN) {
    message = (
      <LangText path="errors.you_dont_have_permission_to_view_this_area_partner_managemen"
      />
    );
  } else if (reason === ACCESS_DENIED_REASON.PLATFORM_STAFF) {
    message = (
      <LangText path="errors.you_dont_have_permission_to_view_the_support_inbox_or_admin_"
      />
    );
  } else {
    message = (
      <LangText path="errors.you_dont_have_permission_to_view_this_page"
      />
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-6 rounded-full bg-muted p-4">
          <ShieldOff className="h-12 w-12 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          <LangText path="errors.access_denied"  />
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link to="/posts">
              <LangText path="nav.home" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/support?type=support">
              <LangText path="errors.contact_support"  />
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
