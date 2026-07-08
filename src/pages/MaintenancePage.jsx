import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@imriva/framework';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { LangText } from '@/components/ui/LangText';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';
import { getAccessToken, getPlatformAuthFromToken, hasSession } from '@/services';
import { Loader2, Wrench } from 'lucide-react';



/**
 * Full-screen maintenance message for signed-in users who are not platform admins.
 * Anonymous visitors are redirected to `/login` first; after sign-in, non-admins are sent here when maintenance is on.
 */
export default function MaintenancePage() {
  const navigate = useNavigate();
  const { maintenanceMode, refresh } = useMaintenanceMode();
  const [retrying, setRetrying] = useState(false);

  const token = getAccessToken();
  const validSession = hasSession();
  const isAuthenticated = Boolean(token) && validSession;
  const platformAuth = token ? getPlatformAuthFromToken(token) : null;
  const isPlatformAdmin = Boolean(platformAuth?.isPlatformAdmin);
  const isPlatformSupport = Boolean(platformAuth?.isPlatformSupport);
  const isPlatformStaff = Boolean(platformAuth?.isPlatformStaff);

  useEffect(() => {
    if (token && isPlatformAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (token && isPlatformSupport && !isPlatformAdmin) {
      navigate(PLATFORM_SUPPORT_INBOX_PATH, { replace: true });
      return;
    }

    // Login comes first: unauthenticated users never stay on this screen.
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { maintenance: true } });
      return;
    }

    if (maintenanceMode === null) {
      return;
    }

    if (maintenanceMode === false) {
      navigate('/posts', { replace: true });
    }
  }, [
    maintenanceMode,
    navigate,
    token,
    isPlatformAdmin,
    isPlatformSupport,
    isAuthenticated,
  ]);

  const onTryAgain = async () => {
    setRetrying(true);
    try {
      const stillOn = await refresh();
      if (!stillOn) {
        navigate('/posts', { replace: true });
      }
    } finally {
      setRetrying(false);
    }
  };

  // Redirect in flight or wrong audience — avoid flashing wrong copy.
  if (!isAuthenticated || isPlatformStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (maintenanceMode === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (maintenanceMode !== true) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center"
      role="alert"
      aria-live="polite"
    >
      <Wrench className="h-14 w-14 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
        <LangText path="maintenance.title"  />
      </h1>
      <p className="max-w-md text-sm text-muted-foreground md:text-base">
        <LangText path="maintenance.body"  />
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={() => void onTryAgain()}
        disabled={retrying}
      >
        {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
        <LangText path="maintenance.tryAgain"  />
      </Button>
    </div>
  );
}
