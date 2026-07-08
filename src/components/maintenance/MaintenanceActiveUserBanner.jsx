import { AlertTriangle } from 'lucide-react';
import { LangText } from '@/components/ui/LangText';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { getAccessToken, getPlatformAuthFromToken, hasSession } from '@/services';



/**
 * Warns signed-in non-staff users during the grace period after maintenance turns on.
 */
export function MaintenanceActiveUserBanner() {
  const { maintenanceMode, gracePeriodActive } = useMaintenanceMode();
  const token = getAccessToken();
  const sessionOk = Boolean(token) && hasSession();
  const isPlatformStaff = Boolean(token && getPlatformAuthFromToken(token).isPlatformStaff);

  if (maintenanceMode !== true || !gracePeriodActive || !sessionOk || isPlatformStaff) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="shrink-0 border-b border-amber-500/40 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-50"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p className="text-sm leading-relaxed">
          <LangText path="maintenance.activeUserBanner"  />
        </p>
      </div>
    </div>
  );
}
