/**
 * Callback page: /callback?code=...&state=...
 * Exchanges the authorization code for tokens, hydrates auth state, then redirects to app.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { useLoading } from '@/contexts/LoadingContext';
import { resolvePostLoginRedirect, maintenanceModeForPostLoginRedirect } from '@/lib/postLoginRedirect';
import { shouldBlockLoginDuringMaintenance } from '@/lib/maintenanceLoginPolicy';
import { ACCOUNT_SUSPENDED_MESSAGE, handleCallback, logout } from '@/services/auth/authService';
import { clearUser } from '@/store/slices/userSlice';
import { useT } from '@/i18n';
import {
  getUserInfoFromIdentity,
  getDisplayNameForSession,
  getHandleFromUserInfo,
  getEmailFromUserInfo,
  getEmailFromAccessToken,
  getAccessToken,
  ensureAccessToken,
  startSessionIdleCheck,
  resolveVdpConnectUserId,
} from '@/services';
import { getPendingSocialSignupHomeCountry } from '@/services/profileService';
import { fetchUserProfile, setUser, ensureProfileAndFetch } from '@/store/slices/userSlice';
import { store } from '@/store/store';
import { profileHasHomeCountry } from '@/lib/homeCountryOnboarding';
import { LangText } from '@/components/ui/LangText';
import { PageLoader } from '@/components/ui/loader';

const HYDRATE_TIMEOUT_MS = 6000;

function stripCallbackQueryFromUrl() {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  if (!url.pathname.endsWith('/callback')) {
    return;
  }
  window.history.replaceState({}, '', url.pathname);
}

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { setLanguage } = useLanguage();
  const t = useT();
  const { maintenanceMode, refresh: refreshMaintenanceMode } = useMaintenanceMode();
  const maintenanceModeRef = useRef(maintenanceMode);
  const refreshMaintenanceModeRef = useRef(refreshMaintenanceMode);
  maintenanceModeRef.current = maintenanceMode;
  refreshMaintenanceModeRef.current = refreshMaintenanceMode;
  const { markInitialLoadComplete } = useLoading();
  const [error, setError] = useState(null);
  const callbackStartedRef = useRef(false);
  /** OAuth query captured once so stripping the URL does not re-run exchange. */
  const initialSearchParamsRef = useRef(null);
  if (initialSearchParamsRef.current === null) {
    initialSearchParamsRef.current = new URLSearchParams(searchParams);
  }

  useEffect(() => {
    if (callbackStartedRef.current) {
      return;
    }
    callbackStartedRef.current = true;

    let cancelled = false;

    const finishRedirect = async (accessToken, returnUrl) => {
      const modeForRedirect = await maintenanceModeForPostLoginRedirect(
        maintenanceModeRef.current,
        refreshMaintenanceModeRef.current,
      );
      if (cancelled) {
        return;
      }
      if (shouldBlockLoginDuringMaintenance(modeForRedirect, accessToken)) {
        logout();
        dispatch(clearUser());
        stripCallbackQueryFromUrl();
        setError(t('maintenance.loginBlocked'));
        return;
      }
      const hasHomeCountry = profileHasHomeCountry(store.getState().user.user);
      const redirectTo = resolvePostLoginRedirect({
        maintenanceMode: modeForRedirect,
        accessToken,
        intendedPath: returnUrl || '/',
        hasHomeCountry,
      });
      stripCallbackQueryFromUrl();
      markInitialLoadComplete();
      navigate(redirectTo, { replace: true });
    };

    (async () => {
      try {
        const params = initialSearchParamsRef.current ?? searchParams;
        const result = await handleCallback(params);
        if (cancelled) {
          return;
        }

        if (result.error) {
          let errorMessage = result.errorDescription || result.error;
          if (result.error === 'invalid_state') {
            errorMessage = t('auth.invalidAuthState');
          } else if (result.error === 'missing_code_or_state') {
            errorMessage = t('auth.authIncomplete');
          } else if (result.error === 'token_exchange_failed') {
            errorMessage = t('auth.authFailedComplete');
          } else if (result.error === 'account_suspended') {
            errorMessage = result.errorDescription || ACCOUNT_SUSPENDED_MESSAGE;
          }
          setError(errorMessage);
          return;
        }

        if (result.restoredLanguage) {
          setLanguage(result.restoredLanguage);
        }
        startSessionIdleCheck();

        let accessToken = result.tokens?.access_token || getAccessToken();
        const returnUrl = result.returnUrl || '/';

        const hydrateAuth = async () => {
          if (!accessToken) {
            return;
          }
          try {
            const userInfo = await getUserInfoFromIdentity(accessToken);
            const userId = resolveVdpConnectUserId(accessToken, userInfo);
            if (!userId) {
              return;
            }
            const displayNameFromIdentity = getDisplayNameForSession(userInfo, accessToken);
            const handleFromIdentity = getHandleFromUserInfo(userInfo);
            const emailForProfile = getEmailFromUserInfo(userInfo) ?? getEmailFromAccessToken(accessToken);
            const profileResult = await dispatch(fetchUserProfile(userId));
            const fulfilled = fetchUserProfile.fulfilled.match(profileResult);
            const profileMissing = fulfilled && profileResult.payload?.profileMissing === true;
            const pendingSocialHomeCountry = getPendingSocialSignupHomeCountry(result.oauthState);
            const usePendingHomeCountry = Boolean(pendingSocialHomeCountry);
            if (!fulfilled || profileMissing) {
              dispatch(setUser({ loggedIn: true, userId, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
              await dispatch(ensureProfileAndFetch({ userId, displayName: displayNameFromIdentity, handle: handleFromIdentity, email: emailForProfile, homeCountryCode: pendingSocialHomeCountry, usePendingHomeCountry }));
            } else {
              const ensureResult = await dispatch(ensureProfileAndFetch({ userId, displayName: displayNameFromIdentity, handle: handleFromIdentity, email: emailForProfile, homeCountryCode: pendingSocialHomeCountry, usePendingHomeCountry }));
              if (!ensureProfileAndFetch.fulfilled.match(ensureResult)) {
                dispatch(setUser({ ...profileResult.payload, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
              }
            }
          } catch (_e) {
            const userId = resolveVdpConnectUserId(accessToken, null);
            if (userId) {
              dispatch(setUser({ loggedIn: true, userId, displayName: getDisplayNameForSession(null, accessToken), handle: null }));
            }
          }
        };

        await Promise.race([
          hydrateAuth(),
          new Promise((resolve) => setTimeout(resolve, HYDRATE_TIMEOUT_MS)),
        ]);

        if (cancelled) {
          return;
        }

        accessToken = (await ensureAccessToken()) ?? accessToken;
        await finishRedirect(accessToken, returnUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('auth.unexpectedError'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally run once: OAuth params are captured in initialSearchParamsRef; re-runs would cancel redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            <LangText path="auth.sign_in_error"  />
          </h1>
          <p className="text-destructive mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <LangText path="maintenance.tryAgain"  />
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              <LangText path="nav.home" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      text={<LangText path="auth.completing_sign_in"  />}
    />
  );
}
