import { useAppSelector } from '@/store/hooks';
import { getAccessToken, getPlatformAuthFromToken } from '@/services';
import { PLATFORM_SUPPORT_INBOX_PATH } from '@/lib/platformSupportRoutes';

/**
 * Platform admin / support flags for UI (JWT + Redux user).
 */
export function usePlatformAccess() {
  const user = useAppSelector((state) => state.user.user);
  const token = getAccessToken();
  const fromToken = token ? getPlatformAuthFromToken(token) : {
    isPlatformAdmin: false,
    isPlatformSupport: false,
    isPlatformStaff: false,
    platformRoles: [],
  };

  const isPlatformAdmin = Boolean(user?.isPlatformAdmin ?? fromToken.isPlatformAdmin);
  const isPlatformSupport = Boolean(
    user?.isPlatformSupport ?? fromToken.isPlatformSupport,
  );
  const isPlatformStaff = Boolean(
    user?.isPlatformStaff
      ?? fromToken.isPlatformStaff
      ?? (isPlatformAdmin || isPlatformSupport),
  );

  const isSupportOnly = isPlatformStaff && !isPlatformAdmin;

  return {
    isPlatformAdmin,
    isPlatformSupport,
    isPlatformStaff,
    isSupportOnly,
    isReadOnlyAdmin: isSupportOnly,
    canPublishPublicContent: !isSupportOnly,
    canPerformAdminWrites: isPlatformAdmin || !isSupportOnly,
    supportInboxPath: PLATFORM_SUPPORT_INBOX_PATH,
    adminHomePath: isSupportOnly ? PLATFORM_SUPPORT_INBOX_PATH : '/admin',
  };
}
