import { useState } from 'react';
import { AppFooter } from './AppFooter';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { MaintenanceActiveUserBanner } from '@/components/maintenance/MaintenanceActiveUserBanner';

export function MainLayout({ children, onPostCreated, fullWidth = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background flex">
      {/* Desktop Sidebar (fixed, out of flow) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Content column: flex stack so main scroll sits flush under header (no fixed header height math — avoids cross-browser gaps). */}
      <div className="flex flex-1 min-w-0 min-h-0 flex-col lg:ml-64 pt-4">
        <MaintenanceActiveUserBanner />
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onPostCreated={onPostCreated}
        />
        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <main>
            <div className={fullWidth ? 'py-4 lg:py-6 w-full safe-inset-x' : 'p-4 lg:p-6 2xl:px-4 safe-inset-x w-full'}>
              {children}
            </div>
            <AppFooter className="px-4 lg:px-6 2xl:px-4 safe-inset-x pb-8" />
          </main>
        </div>
      </div>
    </div>
  );
}
