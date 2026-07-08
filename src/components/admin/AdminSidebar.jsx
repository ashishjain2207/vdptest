import { ArrowLeft, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';


import { usePlatformAccess } from '@/lib/platformAuth';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { getAdminNavItems } from '@/components/admin/adminNavItems';

/**
 * @param {{ onNavigate?: () => void, className?: string }} props
 */
export function AdminSidebar({ onNavigate, className }) {
  const location = useLocation();
  const { isPlatformAdmin, isPlatformSupport, isSupportOnly, adminHomePath } = usePlatformAccess();
  const { contentReportsEnabled } = useFeatureFlags();
  const nav = getAdminNavItems({
    isPlatformAdmin,
    isPlatformSupport,
    isSupportOnly,
    contentReportsEnabled,
  });

  return (
    <div className={cn('flex h-full flex-col bg-card border-border', className)}>
      <div className="p-5 border-b border-border">
        <NavLink
          to={adminHomePath}
          onClick={onNavigate}
          className="flex items-center gap-3 no-underline min-w-0"
          aria-label="vdpConnect Admin"
        >
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-primary-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate leading-tight">vdpConnect</p>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
        <ul className="space-y-1">
          {nav.map((item) => {
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 no-underline min-w-0 min-h-[44px]',
                    'text-foreground hover:bg-muted',
                    isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium',
                  )}
                >
                  <item.icon
                    className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}
                  />
                  <span className="flex-1 min-w-0 truncate">
                    <LangText path={item.labelPath} />
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-border mt-auto">
        <NavLink
          to="/posts"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-underline',
          )}
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <LangText path="nav.backToApp"  />
        </NavLink>
      </div>
    </div>
  );
}
