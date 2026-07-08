import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken, hasSession } from '@/services';
import { useAppSelector } from '@/store/hooks';

/**
 * Resolves the signed-in user consistently across the app.
 * AuthContext and Redux can be briefly out of sync after login; Header already
 * merged both — feed and other pages should use the same source of truth.
 */
export function useAppUser() {
  const {
    user: authContextUser,
    isAuthenticated,
    loading,
    logout,
    login,
    error,
    clearError,
  } = useAuth();
  const reduxUser = useAppSelector((state) => state.user.user);
  const user = authContextUser ?? reduxUser;
  const hasActiveSession =
    isAuthenticated || (Boolean(getAccessToken()) && hasSession());
  const isLoggedIn = Boolean(user?.userId) || hasActiveSession;

  return {
    user,
    isLoggedIn,
    loading,
    hasActiveSession,
    logout,
    login,
    error,
    clearError,
  };
}
