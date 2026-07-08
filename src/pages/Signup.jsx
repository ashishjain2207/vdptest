import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Input, Label, Separator } from '@imriva/framework';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams } from '@/i18n';
import { useMaintenanceMode } from '@/contexts/MaintenanceModeContext';
import { config } from '@/services/config';
import { apiPost } from '@/services';
import { toast } from 'sonner';
import { loginWithExternalProvider } from '@/services/auth/authService';
import { API_BASE } from '@/lib/config';
import { FieldError } from '@/components/ui/FieldError';
import { cn } from '@/lib/utils';
import { CountryMarketCombobox } from '@/components/country/CountryMarketCombobox.jsx';
import { normalizeCountryCode } from '@/lib/activeCountry.js';
import { AuthSupportLink } from '@/components/auth/AuthSupportLink';
import { PasswordRulesChecklist } from '@/components/auth/PasswordRulesChecklist';
import { getPasswordValidation } from '@/lib/passwordValidation';

const DEBOUNCE_MS = 400;
const MIN_USERNAME_LENGTH = 3;

const deriveUsernameFromName = (value) => {
  const slug = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');

  return slug.slice(0, 30);
};

const Signup = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const tr = useTParams();
  const { maintenanceMode } = useMaintenanceMode();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  // Live username availability: null | 'checking' | 'available' | 'taken'
  const [usernameStatus, setUsernameStatus] = useState(null);
  // Live password validation (client-side, instant per-rule feedback)
  const [passwordValidation, setPasswordValidation] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const updatePasswordValidation = useCallback((pwd) => {
    setPasswordValidation(getPasswordValidation(pwd));
  }, []);

  const checkUsernameAvailability = useCallback(async (value) => {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length < MIN_USERNAME_LENGTH || !/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setUsernameStatus(null);
      return;
    }
    setUsernameStatus('checking');
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(
        `${API_BASE}/api/Users/handle/${encodeURIComponent(trimmed)}/available`,
        { signal: abortRef.current.signal },
      );
      if (!res.ok) {
        setUsernameStatus(null);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch (err) {
      if (err.name !== 'AbortError') {setUsernameStatus(null);}
    }
  }, []);

  useEffect(() => {
    const trimmed = username?.trim() ?? '';
    if (trimmed.length < MIN_USERNAME_LENGTH) {
      setUsernameStatus(null);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setUsernameStatus(null);
      return;
    }
    debounceRef.current = setTimeout(() => checkUsernameAvailability(trimmed), DEBOUNCE_MS);
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [username, checkUsernameAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) { return; }
    const usernameTrimmed = (username?.trim() || deriveUsernameFromName(name)) ?? '';

    /** @type {Record<string, string>} */
    const err = {};
    if (!name?.trim()) {
      err.name = t('auth.pleaseEnterName');
    }
    if (!usernameTrimmed) {
      err.username = t('auth.pleaseEnterUsername');
    } else if (usernameTrimmed.length < 3 || usernameTrimmed.length > 30) {
      err.username = t('auth.usernameLength');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(usernameTrimmed)) {
      err.username = t('auth.usernameChars');
    } else if (usernameStatus === 'taken') {
      err.username = t('auth.usernameTaken');
    }
    if (!email?.trim()) {
      err.email = t('auth.pleaseEnterWorkEmail');
    }
    if (!homeCountry?.trim()) {
      err.homeCountry = t('auth.pleaseSelectCountry');
    } else if (!normalizeCountryCode(homeCountry)) {
      err.homeCountry = t('auth.pleaseChooseValidCountryFromList');
    }
    if (!password) {
      err.password = t('auth.pleaseEnterPassword');
    } else if (passwordValidation && !passwordValidation.valid) {
      err.password = t('auth.password_must_meet_all_requirements');
    }

    setFieldErrors(err);
    if (Object.keys(err).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      // Double-check username (handle) availability on submit (in case live check was skipped)
      if (usernameStatus !== 'available') {
        const handleCheckRes = await fetch(
          `${API_BASE}/api/Users/handle/${encodeURIComponent(usernameTrimmed)}/available`,
          { method: 'GET' },
        );
        if (!handleCheckRes.ok) {
          setFieldErrors((prev) => ({
            ...prev,
            username: t('auth.couldNotVerifyUsername'),
          }));
          setSubmitting(false);
          return;
        }
        const handleData = await handleCheckRes.json().catch(() => ({}));
        if (!handleData.available) {
          setFieldErrors((prev) => ({
            ...prev,
            username: t('auth.usernameTaken'),
          }));
          setSubmitting(false);
          return;
        }
      }

      const registerUrl = import.meta.env.DEV
        ? '/api-identity/api/register'
        : `${config.oidc.issuer.replace(/\/$/, '')}/api/register`;
      const registerRes = await apiPost(
        registerUrl,
        {
          email,
          password,
          displayName: name.trim(),
          handle: usernameTrimmed,
        },
        { showLoader: false },
      );

      if (!registerRes.ok) {
        const errBody = await registerRes.json().catch(() => ({}));
        const errText = errBody.error || errBody.message || errBody.title || '';
        const errList = Array.isArray(errBody.errors) ? errBody.errors.join('. ') : '';
        const errDetail = errBody.detail || ''; // Server sends detail in Development (e.g. DB exception)
        const fullError = [errText, errList, errDetail].filter(Boolean).join(' ');
        const isAlreadyExists = registerRes.status === 400 && /already exists|duplicate|existiert bereits/i.test(fullError);
        const msg = isAlreadyExists
          ? t('auth.an_account_with_this_email_already_exists_sign_in_to_your_ac')
          : (fullError || tr('validation.registrationFailed', { status: registerRes.status }));
        toast.error(msg);
        // Log full response for 500 (helps debug server-side errors)
        if (registerRes.status >= 500) {
          console.error('Signup error:', registerRes.status, errBody);
        }
        if (isAlreadyExists) {
          navigate('/login', { replace: true });
        }
        return;
      }

      try {
        const pendingCountry = normalizeCountryCode(homeCountry.trim()) ?? homeCountry.trim().toUpperCase();
        const pendingEmail = email.trim().toLowerCase();
        sessionStorage.setItem('pendingHomeCountry', pendingCountry);
        sessionStorage.setItem('pendingHomeCountryEmail', pendingEmail);
        localStorage.setItem('pendingHomeCountry', pendingCountry);
        localStorage.setItem('pendingHomeCountryEmail', pendingEmail);
      } catch {
        /* ignore */
      }

      const data = await registerRes.json().catch(() => ({}));
      const verificationLink = data.verificationLink;
      if (verificationLink && import.meta.env.DEV) {
        toast.success(
          t('auth.accountCreatedDev'),
          { duration: 8000, description: verificationLink },
        );
      } else {
        toast.success(t('auth.account_created_check_your_email_to_verify_then_sign_in'));
      }
      navigate('/login', { replace: true });
    } catch (registrationError) {
      console.error('Registration error:', registrationError);
      toast.error(t('auth.registration_failed_please_try_again'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (maintenanceMode === true) {
      toast.error(t('maintenance.signupBlocked'));
      return;
    }
    try {
      const providerName = (provider || '').toLowerCase();
      if (providerName === 'google' || providerName === 'microsoft' || providerName === 'linkedin') {
        const pendingCountry = homeCountry?.trim()
          ? normalizeCountryCode(homeCountry.trim())
          : null;
        try {
          if (pendingCountry) {
            sessionStorage.setItem('pendingHomeCountry', pendingCountry);
            sessionStorage.setItem('pendingHomeCountrySocialSignup', '1');
            localStorage.setItem('pendingHomeCountry', pendingCountry);
            if (email?.trim()) {
              const pendingEmail = email.trim().toLowerCase();
              sessionStorage.setItem('pendingHomeCountryEmail', pendingEmail);
              localStorage.setItem('pendingHomeCountryEmail', pendingEmail);
            }
          } else {
            sessionStorage.removeItem('pendingHomeCountrySocialSignup');
            sessionStorage.removeItem('pendingHomeCountry');
            sessionStorage.removeItem('pendingHomeCountryEmail');
            localStorage.removeItem('pendingHomeCountry');
            localStorage.removeItem('pendingHomeCountryEmail');
          }
        } catch {
          /* ignore */
        }
        if (pendingCountry) {
          await loginWithExternalProvider(providerName, undefined, { pendingHomeCountrySignup: true });
        } else {
          await loginWithExternalProvider(providerName);
        }
        // loginWithExternalProvider() redirects; code below does not run
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('External signup error:', err);
      toast.error(t('auth.failed_to_start_sign_in'));
    }
  };

  if (maintenanceMode === true) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-md text-center space-y-4">
          <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-12 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            <LangText path="auth.createAccount"  />
          </h1>
          <p className="text-sm text-muted-foreground">
            <LangText path="maintenance.signupBlocked"  />
          </p>
          <Button type="button" className="w-full" onClick={() => navigate('/login', { replace: true })}>
            <LangText path="auth.backToSignIn"  />
          </Button>
        </div>
        <AuthSupportLink from="/signup" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-background flex relative" data-testid="registration-page">
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
          
          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold text-primary">50K+</p>
              <p className="text-sm text-muted-foreground">
                <LangText path="auth.professionals"  />
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">2K+</p>
              <p className="text-sm text-muted-foreground">
                <LangText path="common.organizations"  />
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100+</p>
              <p className="text-sm text-muted-foreground">
                <LangText path="auth.daily_events"  />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — scrolls inside viewport so Create account stays reachable */}
      <div className="flex-1 min-h-0 h-full auth-scroll-panel scrollbar-thin p-4 sm:p-6 lg:p-8 pt-14 sm:pt-16">
        <div className="w-full max-w-md mx-auto pb-8 space-y-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-2">
            <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-12" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground leading-snug text-balance">
              <LangText path="auth.signUpTitle"
              />
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                className="h-11 gap-2"
                onClick={() => handleSocialLogin('Google')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              Google
              </Button>
              <Button 
                variant="outline" 
                className="h-11 gap-2"
                onClick={() => handleSocialLogin('Microsoft')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M0 0h11.377v11.372H0z"/>
                  <path fill="#00A4EF" d="M12.623 0H24v11.372H12.623z"/>
                  <path fill="#7FBA00" d="M0 12.628h11.377V24H0z"/>
                  <path fill="#FFB900" d="M12.623 12.628H24V24H12.623z"/>
                </svg>
              Microsoft
              </Button>
              <Button 
                variant="outline" 
                className="h-11 gap-2"
                onClick={() => handleSocialLogin('LinkedIn')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              LinkedIn
              </Button>
            </div>

            <div className="relative py-1">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-sm text-muted-foreground">
                <LangText path="auth.signUpWithEmail"  />
              </span>
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                <LangText path="auth.name"  />
                <span className="text-destructive" aria-hidden> *</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  data-testid="registration-name-input"
                  placeholder={t('auth.e_g_john_smith')}
                  className={cn(
                    'pl-10 h-11',
                    fieldErrors.name ? 'border-destructive focus-visible:ring-destructive' : '',
                  )}
                  value={name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setName(nextName);
                    setUsername((prev) => prev || deriveUsernameFromName(nextName));
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.name;
                      return n;
                    });
                  }}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'signup-name-err' : undefined}
                />
              </div>
              <FieldError id="signup-name-err" message={fieldErrors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                <LangText path="settings.username"  />
                <span className="text-destructive" aria-hidden> *</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  data-testid="registration-username-input"
                  placeholder={t('auth.e_g_johndoe')}
                  className={cn(
                    'pl-10 h-11 pr-10',
                    (fieldErrors.username || usernameStatus === 'taken') ? 'border-destructive focus-visible:ring-destructive' : '',
                  )}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.username;
                      return n;
                    });
                  }}
                  aria-invalid={Boolean(fieldErrors.username || usernameStatus === 'taken')}
                  aria-describedby={fieldErrors.username ? 'signup-username-err' : undefined}
                />
                {usernameStatus === 'checking' && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === 'available' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600 dark:text-green-500" />
                )}
                {usernameStatus === 'taken' && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                )}
              </div>
              <FieldError id="signup-username-err" message={fieldErrors.username} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-home-country" className="text-foreground">
                <LangText path="common.country"  />
                <span className="text-destructive" aria-hidden> *</span>
                <span className="sr-only"> ({t('auth.countryRequiredForEmail')})</span>
              </Label>
              <CountryMarketCombobox
                id="signup-home-country"
                data-testid="registration-country-input"
                source="supported"
                language={language === 'DE' ? 'DE' : 'EN'}
                value={homeCountry}
                onChange={(code) => {
                  setHomeCountry(code);
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.homeCountry;
                    return n;
                  });
                }}
                inputClassName={fieldErrors.homeCountry ? 'border-destructive' : undefined}
                aria-invalid={Boolean(fieldErrors.homeCountry)}
                aria-describedby={fieldErrors.homeCountry ? 'signup-home-country-err' : undefined}
              />
              <FieldError id="signup-home-country-err" message={fieldErrors.homeCountry} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                <LangText path="auth.businessEmailAddress"  />
                <span className="text-destructive" aria-hidden> *</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  data-testid="registration-email-input"
                  placeholder={t('auth.you_company_com')}
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
                  aria-describedby={fieldErrors.email ? 'signup-email-err' : undefined}
                />
              </div>
              <FieldError id="signup-email-err" message={fieldErrors.email} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground">
                <LangText path="auth.password"  />
                <span className="text-destructive" aria-hidden> *</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="registration-password-input"
                  placeholder={t('auth.passwordPlaceholder')}
                  className={cn(
                    'pl-10 pr-12 h-11',
                    (fieldErrors.password || (password && passwordValidation && !passwordValidation.valid))
                      ? 'border-destructive focus-visible:ring-destructive'
                      : '',
                  )}
                  value={password}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPassword(v);
                    updatePasswordValidation(v);
                    setFieldErrors((prev) => {
                      const n = { ...prev };
                      delete n.password;
                      return n;
                    });
                  }}
                  aria-invalid={Boolean(fieldErrors.password || (password && passwordValidation && !passwordValidation.valid))}
                  aria-describedby={fieldErrors.password ? 'signup-password-err' : undefined}
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
              <FieldError id="signup-password-err" message={fieldErrors.password} />
              <PasswordRulesChecklist password={password} validation={passwordValidation} className="gap-y-0.5" />
            </div>

            <Button type="submit" data-testid="registration-submit-button" className="w-full h-11 shadow-soft mt-1" disabled={submitting || usernameStatus === 'taken' || (password && passwordValidation && !passwordValidation.valid)}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <LangText path="auth.creating_account"  />
                </>
              ) : (
                <LangText path="auth.createFreeAccount"  />
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
              <LangText path="auth.by_signing_up_you_agree_to_our"  />{' '}
              <Link to="/terms" state={{ from: '/signup' }} className="text-primary hover:underline">
                <LangText path="layout.terms_of_service"  />
              </Link>
              ,{' '}
              <LangText path="auth.signupLegalArticle" />
              <Link to="/privacy" state={{ from: '/signup' }} className="text-primary hover:underline">
                <LangText path="layout.privacy_policy"  />
              </Link>
              ,{' '}
              <LangText path="auth.signupLegalArticle" />
              <Link to="/cookie" state={{ from: '/signup' }} className="text-primary hover:underline">
                <LangText path="layout.cookie_policy"  />
              </Link>
              <LangText path="auth.signupLegalAnd" />
              <LangText path="auth.signupLegalArticle" />
              <Link to="/accessibility" state={{ from: '/signup' }} className="text-primary hover:underline">
                <LangText path="layout.accessibility"  />
              </Link>
              <LangText path="auth.signupLegalEnd" />
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-2">
            <LangText path="auth.alreadyRegistered"  />{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              <LangText path="auth.signIn"  />
            </Link>
          </p>
        </div>
      </div>
      <AuthSupportLink from="/signup" />
    </div>
  );
};

export default Signup;
