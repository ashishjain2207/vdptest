import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Label } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { Switch } from '@/components/ui/switch';
import { getAdminPlatformSettings, updateAdminPlatformSettings } from '@/services/adminPlatformSettingsService';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

/**
 * Admin Settings — reference layout: Platform Settings (maintenance) + Email Configuration + Save.
 */
const AdminSettings = () => {
  const t = useT();
  const { refresh: refreshMaintenancePublic } = useMaintenanceMode();
  const [settingsReady, setSettingsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getAdminPlatformSettings();
        if (cancelled) {
          return;
        }
        setMaintenanceMode(Boolean(data.maintenanceMode ?? data.MaintenanceMode));
        setSupportEmail(String(data.supportEmail ?? data.SupportEmail ?? ''));
        setAdminNotificationEmail(String(data.adminNotificationEmail ?? data.AdminNotificationEmail ?? ''));
      } catch (e) {
        if (!cancelled) {
          toast.error(e?.message || t('adminSettings.loadFailed'));
        }
      } finally {
        if (!cancelled) {
          setSettingsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminPlatformSettings({
        maintenanceMode,
        supportEmail: supportEmail.trim(),
        adminNotificationEmail: adminNotificationEmail.trim(),
      });
      await refreshMaintenancePublic();
      toast.success(t('adminSettings.saveSuccess'));
    } catch (err) {
      toast.error(err?.message || t('adminSettings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const cardClass = 'rounded-xl border border-border bg-card p-6 shadow-sm space-y-5';

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <Button variant="ghost" size="sm" className="gap-2 -ml-2 w-fit text-muted-foreground" asChild>
        <Link to="/admin">
          <ArrowLeft className="w-4 h-4" />
          <LangText path="admin.back_to_admin_dashboard"  />
        </Link>
      </Button>

      <div>
        <h1 className="partner-admin-heading text-2xl md:text-3xl">
          <LangText path="nav.adminSystemSettings"  />
        </h1>
      </div>

      <form
        onSubmit={onSave}
        className={cn('space-y-6', !settingsReady && 'pointer-events-none opacity-60')}
        aria-busy={!settingsReady}
      >
        <div className={cardClass}>
          <div>
            <h2 className={cn('text-lg font-semibold', 'text-[hsl(var(--heading))]')}>
              <LangText path="admin.platform_settings"  />
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                <LangText path="admin.enable_maintenance_mode"  />
              </p>
              <p className="text-sm text-muted-foreground">
                <LangText path="adminSettings.maintenanceHelper"  />
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              className="shrink-0"
              aria-label={t('admin.enable_maintenance_mode')}
            />
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={cn('text-lg font-semibold', 'text-[hsl(var(--heading))]')}>
            <LangText path="admin.email_settings"  />
          </h2>
          <p className="text-sm text-muted-foreground">
            <LangText path="adminSettings.emailSectionHint"  />
          </p>
          <div className="space-y-2">
            <Label htmlFor="support-email">
              <LangText path="adminSettings.supportEmail"  />
            </Label>
            <Input
              id="support-email"
              type="email"
              autoComplete="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="rounded-xl bg-muted/40 border-border"
              placeholder={t('placeholders.emailExample')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">
              <LangText path="adminSettings.adminNotificationEmail"
              />
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={adminNotificationEmail}
              onChange={(e) => setAdminNotificationEmail(e.target.value)}
              className="rounded-xl bg-muted/40 border-border"
              placeholder={t('placeholders.emailExample')}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="rounded-xl px-8 shadow-soft bg-primary text-primary-foreground hover:bg-secondary"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <LangText path="common.saveChanges"  />
        </Button>
      </form>
    </div>
  );
};

export default AdminSettings;
