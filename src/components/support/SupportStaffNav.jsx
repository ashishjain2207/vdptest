import { NavLink, useLocation } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { getSupportNavItems } from '@/components/admin/adminNavItems';

/**
 * Secondary nav for platform support staff pages in the main app shell.
 */
export function SupportStaffNav() {
  const location = useLocation();
  const { contentReportsEnabled } = useFeatureFlags();
  const nav = getSupportNavItems({ contentReportsEnabled });

  if (nav.length <= 1) {
    return null;
  }

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3"
      aria-label="Support staff"
    >
      {nav.map((item) => {
        const isActive = item.end
          ? location.pathname === item.path
          : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            <LangText path={item.labelPath} />
          </NavLink>
        );
      })}
    </nav>
  );
}
