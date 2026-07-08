import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import { useT } from '@/i18n';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { getHomeCountryCode } from '@/lib/activeCountry';
import { getAccessToken, getPlatformAuthFromToken } from '@/services';

const SESSION_TOAST_KEY = 'imriva.homeCountryToastShown';

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/callback',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/maintenance',
  '/terms',
  '/privacy',
  '/cookie',
  '/accessibility',
  '/support',
];

function isPublicAuthPath(pathname) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * One Sonner toast per session when home country is missing (no top banner).
 * Platform admins are skipped.
 */
export function HomeCountryToastReminder() {
  const t = useT();
  const { maintenanceMode } = useMaintenanceMode();
  const { pathname } = useLocation();
  const user = useAppSelector((s) => s.user.user);
  const loading = useAppSelector((s) => s.user.loading);

  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const isPlatformAdmin = Boolean(token && getPlatformAuthFromToken(token).isPlatformAdmin);
  const onPublic = isPublicAuthPath(pathname);
  const hasHomeCountry = Boolean(
    String(user?.homeCountryCode ?? '').trim() || getHomeCountryCode(),
  );
  const needsHome =
    maintenanceMode !== true &&
    !onPublic &&
    Boolean(user?.loggedIn && user?.userId) &&
    !loading &&
    !isPlatformAdmin &&
    !hasHomeCountry;

  useEffect(() => {
    if (!needsHome || typeof sessionStorage === 'undefined') {
      return;
    }
    try {
      if (sessionStorage.getItem(SESSION_TOAST_KEY) === '1') {
        return;
      }
      sessionStorage.setItem(SESSION_TOAST_KEY, '1');
    } catch {
      return;
    }

    toast.info(t('profile.homeCountryToast'), { duration: 8000 });
  }, [needsHome, t]);

  return null;
}
