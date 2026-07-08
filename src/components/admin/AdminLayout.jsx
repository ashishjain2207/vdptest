import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePlatformAccess } from '@/lib/platformAuth';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';
import { cn } from '@/lib/utils';
import { Button } from '@imriva/framework';
import { X } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { AppFooter } from '@/components/layout/AppFooter';

/**
 * Full-screen admin shell: own sidebar and header (not the main app sidebar).
 */
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSupportOnly } = usePlatformAccess();

  if (isSupportOnly) {
    return <Navigate to={PLATFORM_SUPPORT_INBOX_PATH} replace />;
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 border-r border-border z-40">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[10000] md:hidden transition-opacity',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-[min(100%,18rem)] bg-card border-r border-border shadow-lg transition-transform',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-end border-b border-border p-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="h-[calc(100%-3rem)] overflow-hidden">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} className="border-0" />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} />
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin bg-[hsl(343_35%_96%)] dark:bg-background"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="p-4 lg:p-6 safe-inset-x w-full max-w-[1600px] mx-auto">
            <Outlet />
            <AppFooter className="pb-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
