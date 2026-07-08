import { useState } from 'react';
import {
  LayoutGrid,
  Shield,
  FileText,
  Users,
  Key,
  Palette,
  ScrollText,
  ChevronLeft,
  Settings,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@imriva/framework';
import { Link } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import StudioDashboard from '@/components/studio/StudioDashboard';
import StudioBranding from '@/components/studio/StudioBranding';
import StudioApiOAuth from '@/components/studio/StudioApiOAuth';
import StudioModeration from '@/components/studio/StudioModeration';
import StudioContent from '@/components/studio/StudioContent';
import StudioUsers from '@/components/studio/StudioUsers';
import StudioLogs from '@/components/studio/StudioLogs';

const menuItems = [
  { id: 'dashboard', label: 'Apps', icon: LayoutGrid },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'api', label: 'API & OAuth', icon: Key },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'logs', label: 'Logs', icon: ScrollText },
];

const Studio = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
    case 'dashboard':
      return <StudioDashboard />;
    case 'moderation':
      return <StudioModeration />;
    case 'content':
      return <StudioContent />;
    case 'users':
      return <StudioUsers />;
    case 'api':
      return <StudioApiOAuth />;
    case 'branding':
      return <StudioBranding />;
    case 'logs':
      return <StudioLogs />;
    default:
      return <StudioDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-9" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                  'hover:bg-accent',
                  activeSection === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="p-3 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <ChevronLeft className="w-4 h-4" />
              <LangText path="nav.backToApp"  />
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {menuItems.find(m => m.id === activeSection)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=150&h=150&fit=crop" />
              <AvatarFallback>AT</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto bg-secondary/30">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Studio;
