import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authNavigate } from '@/contexts/authNavigation';
import { AuthContext } from '@/contexts/authContextInstance';
import {
  getAccessToken,
  getPlatformAuthFromToken,
  logout as authLogout,
  startSessionIdleCheck,
  stopSessionIdleCheck,
  setOnIdleLogout,
  touchSession,
  hasSession,
} from '@/services';
import { clearUser, setUser, fetchUserProfile, ensureProfileAndFetch } from '@/store/slices/userSlice';
import { isAuthOptionalPath } from '@/lib/appRoutes';

export { useAuth, AuthContext } from '@/contexts/authContextInstance';

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();
  
  // Get user data from Redux store
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const error = useAppSelector((state) => state.user.error);
  const initializedRef = useRef(false);
  // Avoid retry loop when backend returns 404 (no VdpConnect profile yet)
  const profileFetchAttemptedForUserIdRef = useRef(null);
  // Backoff after userinfo 5xx/failure to avoid hammering identity server (stops retry storm)
  const userinfoBackoffUntilRef = useRef(0);
  const USERINFO_BACKOFF_MS = 15000;
  const authCheckInFlightRef = useRef(false);

  const logout = useCallback(() => {
    void import('@/services/messagesHub').then((m) => m.disconnectMessagesHub());
    void import('@/services/notificationsHub').then((m) => m.disconnectNotificationsHub());
    authLogout();
    stopSessionIdleCheck();
    dispatch(clearUser());
    authNavigate('/login', { replace: true });
  }, [dispatch]);

  useEffect(() => {
    setOnIdleLogout(logout);
  }, [logout]);

  /** Merge platform roles from JWT payload (OpenIddict) so UI matches API RequireRole / IsInRole. */
  useEffect(() => {
    if (!user?.userId) {
      return;
    }
    const token = getAccessToken();
    if (!token) {
      return;
    }
    const pa = getPlatformAuthFromToken(token);
    const same =
      user.isPlatformAdmin === pa.isPlatformAdmin &&
      user.isPlatformSupport === pa.isPlatformSupport &&
      user.isPlatformStaff === pa.isPlatformStaff &&
      JSON.stringify(user.platformRoles ?? []) === JSON.stringify(pa.platformRoles);
    if (same) {
      return;
    }
    dispatch(setUser({ ...user, ...pa }));
  }, [user, dispatch]);

  useEffect(() => {
    if (!user) {
      return;
    }
    startSessionIdleCheck();
    const onActivity = () => touchSession();
    window.addEventListener('focus', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('scroll', onActivity);
    return () => {
      window.removeEventListener('focus', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('scroll', onActivity);
    };
  }, [user]);

  const login = useCallback(
    async () => {
      // Login is handled by Login page component
      // This function is kept for backward compatibility but should not be used directly
      authNavigate('/login');
    },
    [],
  );
  
  // Check if user is authenticated and session is valid, then fetch user profile
  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const token = getAccessToken();
      const validSession = hasSession();
      const isInUserinfoBackoff = () => Date.now() < userinfoBackoffUntilRef.current;
      const startUserinfoBackoff = () => {
        userinfoBackoffUntilRef.current = Date.now() + USERINFO_BACKOFF_MS;
      };

      // FORCE: Always call identity API to get user info if token exists (unless in backoff after failure)
      if (token && (!user || !user.userId) && !isInUserinfoBackoff()) {
        if (authCheckInFlightRef.current) {return;}
        authCheckInFlightRef.current = true;
        try {
          const { getUserInfoFromIdentity, resolveVdpConnectUserId, getDisplayNameForSession, getHandleFromUserInfo, getEmailFromUserInfo, getEmailFromAccessToken } = await import('@/services');
          const userInfo = await getUserInfoFromIdentity(token);
          const displayNameFromIdentity = getDisplayNameForSession(userInfo, token);
          const handleFromIdentity = getHandleFromUserInfo(userInfo);
          const emailForProfile = getEmailFromUserInfo(userInfo) ?? getEmailFromAccessToken(token);
          const userId = resolveVdpConnectUserId(token, userInfo);
          if (userId) {
            profileFetchAttemptedForUserIdRef.current = userId;
            const profileResult = await dispatch(fetchUserProfile(userId));
            const fulfilled = fetchUserProfile.fulfilled.match(profileResult);
            const profileMissing = fulfilled && profileResult.payload?.profileMissing === true;
            if (!fulfilled || profileMissing) {
              dispatch(setUser({ loggedIn: true, userId, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
              await dispatch(ensureProfileAndFetch({ userId, displayName: displayNameFromIdentity, handle: handleFromIdentity, email: emailForProfile }));
            } else {
              const ensureResult = await dispatch(ensureProfileAndFetch({ userId, displayName: displayNameFromIdentity, handle: handleFromIdentity, email: emailForProfile }));
              if (!ensureProfileAndFetch.fulfilled.match(ensureResult)) {
                dispatch(setUser({ ...profileResult.payload, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
              }
            }
            return;
          }
          startUserinfoBackoff();
        } catch (_e) {
          // userinfo threw; try JWT fallback so user still sees as logged in
          const { resolveVdpConnectUserId, getEmailFromAccessToken, getDisplayNameFromAccessToken } = await import('@/services');
          const userId = resolveVdpConnectUserId(token, null);
          const emailFromToken = getEmailFromAccessToken(token);
          const displayFallback = getDisplayNameFromAccessToken(token) ?? 'User';
          if (userId) {
            profileFetchAttemptedForUserIdRef.current = userId;
            const profileResult = await dispatch(fetchUserProfile(userId));
            const needsEnsure =
              profileResult.payload?.profileMissing === true
              || profileResult.payload?.handle === null
              || profileResult.payload?.handle === undefined;
            if (!fetchUserProfile.fulfilled.match(profileResult)) {
              dispatch(setUser({ loggedIn: true, userId, displayName: displayFallback, handle: null }));
              await dispatch(ensureProfileAndFetch({ userId, displayName: displayFallback, email: emailFromToken }));
            } else if (needsEnsure) {
              dispatch(setUser({ ...profileResult.payload, loggedIn: true, userId, displayName: profileResult.payload?.displayName ?? displayFallback, handle: profileResult.payload?.handle ?? null }));
              const ensureResult = await dispatch(ensureProfileAndFetch({ userId, displayName: displayFallback, email: emailFromToken }));
              if (!ensureProfileAndFetch.fulfilled.match(ensureResult)) {
                dispatch(setUser({ loggedIn: true, userId, displayName: displayFallback, handle: null }));
              }
            } else {
              dispatch(setUser(profileResult.payload));
            }
            return;
          }
          startUserinfoBackoff();
        }
        finally {
          authCheckInFlightRef.current = false;
        }
      }


      if (token && validSession) {
        // Always try to initialize if user is not loaded or missing userId
        if (!initializedRef.current || !user || !user.userId) {
          // Reset initialized flag if previous attempt failed
          if (user && !user.userId) {
            initializedRef.current = false;
          }
          
          if (!initializedRef.current && !isInUserinfoBackoff()) {
            initializedRef.current = true;
            try {
              const { getUserInfoFromIdentity, resolveVdpConnectUserId, getDisplayNameForSession, getHandleFromUserInfo, getEmailFromUserInfo, getEmailFromAccessToken } = await import('@/services');
              const userInfo = await getUserInfoFromIdentity(token);
              const displayNameFromIdentity = getDisplayNameForSession(userInfo, token);
              const handleFromIdentity = getHandleFromUserInfo(userInfo);
              const emailForProfile = getEmailFromUserInfo(userInfo) ?? getEmailFromAccessToken(token);
              const userId = resolveVdpConnectUserId(token, userInfo);
              if (!userId) {
                startUserinfoBackoff();
                initializedRef.current = false;
              }
              if (userId) {
                profileFetchAttemptedForUserIdRef.current = userId;
                const profileResult = await dispatch(fetchUserProfile(userId));
                const fulfilled = fetchUserProfile.fulfilled.match(profileResult);
                const profileMissing = fulfilled && profileResult.payload?.profileMissing === true;
                if (!fulfilled || profileMissing) {
                  dispatch(setUser({ loggedIn: true, userId, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
                  await dispatch(ensureProfileAndFetch({ userId, displayName: displayNameFromIdentity, handle: handleFromIdentity, email: emailForProfile }));
                } else {
                  const ensureResult = await dispatch(ensureProfileAndFetch({ userId, displayName: displayNameFromIdentity, handle: handleFromIdentity, email: emailForProfile }));
                  if (!ensureProfileAndFetch.fulfilled.match(ensureResult)) {
                    dispatch(setUser({ ...profileResult.payload, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
                  }
                }
              }
            } catch (_e) {
              const { resolveVdpConnectUserId, getEmailFromAccessToken, getDisplayNameFromAccessToken } = await import('@/services');
              const userId = resolveVdpConnectUserId(token, null);
              const emailFromToken = getEmailFromAccessToken(token);
              const displayFallback = getDisplayNameFromAccessToken(token) ?? 'User';
              if (userId) {
                profileFetchAttemptedForUserIdRef.current = userId;
                const profileResult = await dispatch(fetchUserProfile(userId));
                const needsEnsure =
                  profileResult.payload?.profileMissing === true
                  || profileResult.payload?.handle === null
                  || profileResult.payload?.handle === undefined;
                if (!fetchUserProfile.fulfilled.match(profileResult)) {
                  dispatch(setUser({ loggedIn: true, userId, displayName: displayFallback, handle: null }));
                  await dispatch(ensureProfileAndFetch({ userId, displayName: displayFallback, email: emailFromToken }));
                } else if (needsEnsure) {
                  dispatch(setUser({ ...profileResult.payload, loggedIn: true, userId, displayName: profileResult.payload?.displayName ?? displayFallback, handle: profileResult.payload?.handle ?? null }));
                  await dispatch(ensureProfileAndFetch({ userId, displayName: displayFallback, email: emailFromToken }));
                } else {
                  dispatch(setUser(profileResult.payload));
                }
              } else {
                startUserinfoBackoff();
                initializedRef.current = false;
              }
            }
          }
        } else if (user && !user.handle) {
          // Re-fetch at most once per userId; if 404, ensure minimal profile so follow/connect work
          if (user.userId && profileFetchAttemptedForUserIdRef.current !== user.userId) {
            profileFetchAttemptedForUserIdRef.current = user.userId;
            const profileResult = await dispatch(fetchUserProfile(user.userId));
            if (fetchUserProfile.fulfilled.match(profileResult) && (profileResult.payload?.handle === null || profileResult.payload?.handle === undefined)) {
              await dispatch(ensureProfileAndFetch({ userId: user.userId, displayName: user.displayName, handle: user.handle, email: user.contactEmail || undefined }));
            }
          }
        } else if (!user?.userId && user?.handle && !isInUserinfoBackoff()) {
          // userId missing but handle present: get userId from identity and fetch once
          try {
            const { getUserInfoFromIdentity, resolveVdpConnectUserId } = await import('@/services');
            const userInfo = await getUserInfoFromIdentity(token);
            const userId = resolveVdpConnectUserId(token, userInfo);
            if (!userId) {
              startUserinfoBackoff();
            } else if (profileFetchAttemptedForUserIdRef.current !== userId) {
              profileFetchAttemptedForUserIdRef.current = userId;
              dispatch(fetchUserProfile(userId));
            }
          } catch (_e) {
            startUserinfoBackoff();
          }
        } else if (user?.userId) {
          profileFetchAttemptedForUserIdRef.current = user.userId;
        }
        // User with Identity but no VdpConnect profile: do not redirect to signup; they can complete profile in Settings > Profile
      } else if ((!token || !validSession) && user) {
        // Session expired or token missing
        // hasSession() already triggered onIdleLogout callback,
        // but we also update state here to ensure consistency
        dispatch(clearUser());
        initializedRef.current = false;
        profileFetchAttemptedForUserIdRef.current = null;
        stopSessionIdleCheck();
        // Do not redirect away from legal pages and auth flows (terms, signup, etc.)
        if (!isAuthOptionalPath(window.location.pathname)) {
          authNavigate('/login', { replace: true });
        }
      }
    };
    
    checkAuthAndFetchProfile();

    const checkSessionExpiredOnly = () => {
      const token = getAccessToken();
      const validSession = hasSession();
      if ((!token || !validSession) && user) {
        dispatch(clearUser());
        initializedRef.current = false;
        profileFetchAttemptedForUserIdRef.current = null;
        stopSessionIdleCheck();
        if (!isAuthOptionalPath(window.location.pathname)) {
          authNavigate('/login', { replace: true });
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiredOnly();
      }
    };
    const onFocus = () => {
      checkSessionExpiredOnly();
    };
    const onOnline = () => {
      checkSessionExpiredOnly();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [user, dispatch]);

  const value = useMemo(
    () => ({
      user,
      setUser: (userData) => {
        if (userData) {
          dispatch({ type: 'user/setUser', payload: userData });
        } else {
          dispatch(clearUser());
        }
      },
      isAuthenticated: Boolean(user) || Boolean(getAccessToken()) || hasSession(),
      login,
      logout,
      loading,
      error,
      clearError: () => {},
    }),
    [user, login, logout, loading, error, dispatch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}