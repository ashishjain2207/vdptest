import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsSidebar } from './SettingsSidebar';
import { LangText } from '@/components/ui/LangText';

export const SettingsLayout = ({ children, title, description }) => {
  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6"><LangText path="nav.settings"  /></h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <SettingsSidebar />
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
