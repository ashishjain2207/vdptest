import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Label, Separator } from '@imriva/framework';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LangText } from '@/components/ui/LangText';
import { ButtonLoader } from '@/components/ui/loader';
import { useT } from '@/i18n';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useAppDispatch } from '@/store/hooks';
import { getAccessToken, startSessionIdleCheck, hasSession, getUserInfoFromIdentity, getDisplayNameFromUserInfo, getDisplayNameFromAccessToken, getHandleFromUserInfo, getEmailFromUserInfo, getEmailFromAccessToken, resolveVdpConnectUserId } from '@/services';
import { ACCOUNT_SUSPENDED_MESSAGE, loginWithExternalProvider, loginWithPassword, logout } from '@/services/auth/authService';
import { fetchUserProfile, setUser, ensureProfileAndFetch, clearUser } from '@/store/slices/userSlice';
import { FieldError } from '@/components/ui/FieldError';
import { cn } from '@/lib/utils';
import { maintenanceModeForPostLoginRedirect, resolvePostLoginRedirect } from '@/lib/postLoginRedirect';
import { store } from '@/store/store';
import { profileHasHomeCountry } from '@/lib/homeCountryOnboarding';
import { shouldBlockLoginDuringMaintenance } from '@/lib/maintenanceLoginPolicy';
import { AuthSupportLink } from '@/components/auth/AuthSupportLink';

const RETURN_URL_KEY = 'oidc_return_url';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const t = useT();
  const { maintenanceMode, refresh: refreshMaintenanceMode } = useMaintenanceMode();
  const { setLoading: setGlobalLoading, markInitialLoadComplete } = useLoading();
  const [isLoading, setIsLoading] = useState(false);
  /** Which external provider is currently loading: 'Google' | 'Microsoft' | 'LinkedIn' | null. Only that button shows a loader. */
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const redirectWhenTokenRef = useRef(false);
  const redirectingAfterLoginRef = useRef(false);

  // Get returnUrl from query params
  const returnUrl = searchParams.get('returnUrl') || '/';
  /** After /reset-password success we navigate to /login?passwordReset=1 so ensure-profile uses PasswordReset telemetry and linking. */
  const provisioningReasonPasswordReset = searchParams.get('passwordReset') === '1';

  // Store returnUrl in sessionStorage if present
  useEffect(() => {
    if (returnUrl && returnUrl !== '/') {
      sessionStorage.setItem(RETURN_URL_KEY, returnUrl);
    }
  }, [returnUrl]);

  // If access_token exists and session is valid, redirect once maintenance status is known
  useEffect(() => {
    let cancelled = false;
    if (redirectWhenTokenRef.current || maintenanceMode === null) {
      return () => {
        cancelled = true;
      };
    }
    const token = getAccessToken();
    if (token && hasSession()) {
      redirectWhenTokenRef.current = true;
      const storedReturnUrl = sessionStorage.getItem(RETURN_URL_KEY);
      const intended = storedReturnUrl || returnUrl || '/';
      sessionStorage.removeItem(RETURN_URL_KEY);
      const redirectAfterProfileHydration = async () => {
        let profile = store.getState().user.user;
        if (!profile?.userId) {
          const userId = resolveVdpConnectUserId(token, null);
          if (userId) {
            const result = await dispatch(fetchUserProfile(userId));
            if (fetchUserProfile.fulfilled.match(result) && result.payload?.profileMissing !== true) {
              profile = result.payload;
            } else {
              profile = store.getState().user.user;
            }
          }
        }

        if (cancelled) {
          return;
        }

        const redirectTo = resolvePostLoginRedirect({
          maintenanceMode,
          accessToken: token,
          intendedPath: intended,
          hasHomeCountry: profileHasHomeCountry(profile),
        });
        navigate(redirectTo, { replace: true });
      };

      void redirectAfterProfileHydration();
    }
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, maintenanceMode, returnUrl]);

  const handleLogin = async () => {
    /** @type {Record<string, string>} */
    const next = {};
    if (!email.trim()) {
      next.email = t('validation.emailRequired');
    }
    if (!password) {
      next.password = t('validation.passwordRequired');
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setEmailNotVerified(false);

    try {
      const result = await loginWithPassword(email, password);

      // If there's an error, don't show loader - just show error and stay on page
      if (result.error) {
        setEmailNotVerified(result.error === 'email_not_verified');
        setError(
          result.error === 'account_suspended'
            ? (result.errorDescription || ACCOUNT_SUSPENDED_MESSAGE)
            : (result.errorDescription || result.error),
        );
        setIsLoading(false);
        return;
      }

      if (redirectingAfterLoginRef.current) {return;}
      redirectingAfterLoginRef.current = true;
      startSessionIdleCheck();
      const storedReturnUrl = sessionStorage.getItem(RETURN_URL_KEY);
      const intended = storedReturnUrl || returnUrl || '/';
      sessionStorage.removeItem(RETURN_URL_KEY);

      // Hydrate auth in Redux (same as Callback) - always call ensure-profile so API can create/update with full name and username from Identity
      const accessToken = result.tokens?.access_token || getAccessToken();
      if (accessToken) {
        try {
          const userInfo = await getUserInfoFromIdentity(accessToken);
          const userId = resolveVdpConnectUserId(accessToken, userInfo);
          if (userId) {
            const displayNameFromIdentity = getDisplayNameFromUserInfo(userInfo);
            const handleFromIdentity = getHandleFromUserInfo(userInfo);
            const emailForProfile = getEmailFromUserInfo(userInfo) ?? getEmailFromAccessToken(accessToken);
            const profileResult = await dispatch(fetchUserProfile(userId));
            const ensurePayload = {
              userId,
              displayName: displayNameFromIdentity,
              handle: handleFromIdentity,
              email: emailForProfile,
              ...(provisioningReasonPasswordReset ? { reason: 1 } : {}),
            };
            const fulfilled = fetchUserProfile.fulfilled.match(profileResult);
            const profileMissing = fulfilled && profileResult.payload?.profileMissing === true;
            if (!fulfilled || profileMissing) {
              dispatch(setUser({ loggedIn: true, userId, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
              await dispatch(ensureProfileAndFetch(ensurePayload));
            } else {
              const ensureResult = await dispatch(ensureProfileAndFetch(ensurePayload));
              if (!ensureProfileAndFetch.fulfilled.match(ensureResult)) {
                dispatch(setUser({ ...profileResult.payload, displayName: displayNameFromIdentity, handle: handleFromIdentity }));
              }
            }
          }
        } catch (_e) {
          const userId = resolveVdpConnectUserId(accessToken, null);
          const emailFromToken = getEmailFromAccessToken(accessToken);
          if (userId) {
            const profileResult = await dispatch(fetchUserProfile(userId));
            const displayFallback = getDisplayNameFromAccessToken(accessToken) ?? 'User';
            const ensurePayload = {
              userId,
              displayName: displayFallback,
              email: emailFromToken,
              ...(provisioningReasonPasswordReset ? { reason: 1 } : {}),
            };
            const fulfilled = fetchUserProfile.fulfilled.match(profileResult);
            const profileMissing = fulfilled && profileResult.payload?.profileMissing === true;
            if (!fulfilled || profileMissing) {
              dispatch(setUser({ loggedIn: true, userId, displayName: displayFallback, handle: null }));
              await dispatch(ensureProfileAndFetch(ensurePayload));
            } else if (profileResult.payload?.handle === null || profileResult.payload?.handle === undefined) {
              await dispatch(ensureProfileAndFetch(ensurePayload));
            } else {
              dispatch(setUser(profileResult.payload));
            }
          }
        }
      }
      markInitialLoadComplete();
      const accessTokenForRedirect = result.tokens?.access_token || getAccessToken();
      const modeForRedirect = await maintenanceModeForPostLoginRedirect(
        maintenanceMode,
        refreshMaintenanceMode,
      );
      if (shouldBlockLoginDuringMaintenance(modeForRedirect, accessTokenForRedirect)) {
        logout();
        dispatch(clearUser());
        redirectingAfterLoginRef.current = false;
        setError(t('maintenance.loginBlocked'));
        setIsLoading(false);
        setGlobalLoading(false);
        return;
      }
      const hasHomeCountry = profileHasHomeCountry(store.getState().user.user);
      const redirectTo = resolvePostLoginRedirect({
        maintenanceMode: modeForRedirect,
        accessToken: accessTokenForRedirect,
        intendedPath: intended,
        hasHomeCountry,
      });
      navigate(redirectTo, { replace: true });
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('auth.login_failed')));
      setIsLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setLoadingProvider(provider);
      setError(null);
      // Store returnUrl before initiating external provider flow
      if (returnUrl && returnUrl !== '/') {
        sessionStorage.setItem(RETURN_URL_KEY, returnUrl);
      }
      const providerName = (provider || '').toLowerCase();
      if (providerName === 'google' || providerName === 'microsoft' || providerName === 'linkedin') {
        await loginWithExternalProvider(providerName);
        // Note: loginWithExternalProvider() redirects, so code after this won't execute
      } else {
        setLoadingProvider(null);
      }
    } catch (err) {
      console.error('External login error:', err);
      setError(err instanceof Error ? err.message : (t('auth.failed_to_initiate_external_login')));
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative" data-testid="login-page">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-muted" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center mb-8">
            <img src="/vdpConnect.png" alt="vdpConnect logo" width="278.4px" height="72px" />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4 text-secondary">
            <LangText path="auth.signUpHeadline"
            />
          </h1>
          <p className="text-lg text-foreground max-w-md">
            <LangText path="auth.signUpTagline"
            />
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-12" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              <LangText path="auth.welcome_back"  />
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <LangText path="auth.signInSubtitle"
              />
            </p>
          </div>

          {maintenanceMode === true ? (
            <div
              role="status"
              className="mb-6 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left text-sm text-muted-foreground"
            >
              <LangText path="maintenance.loginStaffOnly"  />
            </div>
          ) : null}

          {/* Social Login */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button 
              variant="outline" 
              className="h-11 gap-2"
              onClick={() => handleSocialLogin('Google')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'Google' ? (
                <ButtonLoader />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google
            </Button>
            <Button 
              variant="outline" 
              className="h-11 gap-2"
              onClick={() => handleSocialLogin('Microsoft')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'Microsoft' ? (
                <ButtonLoader />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M0 0h11.377v11.372H0z"/>
                  <path fill="#00A4EF" d="M12.623 0H24v11.372H12.623z"/>
                  <path fill="#7FBA00" d="M0 12.628h11.377V24H0z"/>
                  <path fill="#FFB900" d="M12.623 12.628H24V24H12.623z"/>
                </svg>
              )}
              Microsoft
            </Button>
            <Button 
              variant="outline" 
              className="h-11 gap-2"
              onClick={() => handleSocialLogin('LinkedIn')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'LinkedIn' ? (
                <ButtonLoader />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              )}
              LinkedIn
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-sm text-muted-foreground">
              <LangText path="auth.signInWithEmail"  />
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              {(emailNotVerified || /email.*verif|not been verified|nicht bestätigt/i.test(error)) && (
                <p className="text-sm mt-2">
                  <Link to="/verify-email?resend=1" className="text-primary font-medium hover:underline">
                    {t('auth.resend_verification_email_or_open_the_link_from_your_inbox')}
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Username/Password Login Form */}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                <LangText path="auth.email"  />
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  data-testid="login-email-input"
                  placeholder={t('auth.name_company_com')}
                  className={cn(
                    'pl-10 h-11',
                    fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : '',
                  )}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.email;
                      return n;
                    });
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
                  autoComplete="username"
                  disabled={isLoading || loadingProvider !== null}
                />
              </div>
              <FieldError id="login-email-err" message={fieldErrors.email} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">
                  <LangText path="auth.password"  />
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  <LangText path="auth.forgot_password"  />
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="login-password-input"
                  placeholder={t('auth.enter_your_password')}
                  className={cn(
                    'pl-10 pr-12 h-11',
                    fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : '',
                  )}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.password;
                      return n;
                    });
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'login-password-err' : undefined}
                  autoComplete="current-password"
                  disabled={isLoading || loadingProvider !== null}
                />
                <button
                  type="button"
                  aria-label={showPassword ? (t('auth.hide_password')) : (t('auth.show_password'))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError id="login-password-err" message={fieldErrors.password} />
            </div>

            <Button 
              type="submit" 
              data-testid="login-submit-button"
              className="w-full h-11 shadow-soft" 
              disabled={isLoading || loadingProvider !== null}
            >
              {isLoading ? (
                <>
                  <ButtonLoader />
                  <LangText path="auth.signingIn"  />
                </>
              ) : (
                <LangText path="auth.signIn"  />
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <LangText path="auth.noAccount"  />{' '}
            {maintenanceMode === true ? (
              <span className="text-muted-foreground">
                <LangText path="auth.registration_is_temporarily_disabled"  />
              </span>
            ) : (
              <Link to="/signup" className="text-primary font-medium hover:underline">
                <LangText path="auth.createAccount"  />
              </Link>
            )}
          </p>
        </div>
      </div>
      <AuthSupportLink from="/login" />
    </div>
  );
};

export default Login;
