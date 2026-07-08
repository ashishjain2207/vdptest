import { cn } from '@/lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import { Separator } from '@imriva/framework';
import {
  User,
  Lock,
  LogOut,
} from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { useAuth } from '@/contexts/AuthContext';

const settingsLinks = [
  { id: 'profile', path: '/settings/profile', icon: User, labelPath: 'settings.sidebarProfile' },
  { id: 'account', path: '/settings/account', icon: Lock, labelPath: 'settings.sidebarAccount' },
];

export const SettingsSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="bg-card rounded-xl border border-border p-2">
      {settingsLinks.map((link) => {
        const isActive = location.pathname === link.path ||
          (location.pathname === '/settings' && link.id === 'profile');

        return (
          <NavLink
            key={link.id}
            to={link.path}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              'hover:bg-accent',
              isActive && 'bg-accent text-accent-foreground',
            )}
          >
            <link.icon className={cn(
              'w-4 h-4',
              isActive && 'text-primary',
            )} />
            <span className="text-sm font-medium"><LangText path={link.labelPath} /></span>
          </NavLink>
        );
      })}
      <Separator className="my-2" />
      <button
        type="button"
        onClick={logout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium"><LangText path="admin.log_out" /></span>
      </button>
    </div>
  );
};
