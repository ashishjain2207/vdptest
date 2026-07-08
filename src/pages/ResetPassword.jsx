import { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Label } from '@imriva/framework';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LangText } from '@/components/ui/LangText';
import { ButtonLoader } from '@/components/ui/loader';
import { useT } from '@/i18n';
import { config } from '@/services/config';

const PASSWORD_RULE_LABELS = {
  length: { en: 'At least 8 characters', de: 'Mind. 8 Zeichen' },
  uppercase: { en: 'One uppercase letter', de: 'Ein Großbuchstabe' },
  lowercase: { en: 'One lowercase letter', de: 'Ein Kleinbuchstabe' },
  digit: { en: 'One number', de: 'Eine Zahl' },
  nonAlphanumeric: { en: 'One special character (@, #, etc.)', de: 'Ein Sonderzeichen (@, #, etc.)' },
};
const PASSWORD_RULE_ORDER = ['length', 'uppercase', 'lowercase', 'digit', 'nonAlphanumeric'];

// Client-side validation - runs on every keystroke for instant per-rule feedback
const validatePasswordClientSide = (p) => ({
  length: (p ?? '').length >= 8,
  uppercase: /[A-Z]/.test(p ?? ''),
  lowercase: /[a-z]/.test(p ?? ''),
  digit: /\d/.test(p ?? ''),
  nonAlphanumeric: /[^A-Za-z0-9]/.test(p ?? ''),
});

function getIdentityBaseUrl() {
  if (import.meta.env.DEV) {
    return '/api-identity';
  }
  return config.oidc.issuer.replace(/\/$/, '');
}

/** ASP.NET Identity reset tokens are base64; '+' in query strings is often decoded as space. */
function normalizeResetToken(raw) {
  if (!raw) {return null;}
  const trimmed = raw.trim();
  if (!trimmed) {return null;}
  if (trimmed.includes(' ') && !trimmed.includes('+')) {
    return trimmed.replace(/ /g, '+');
  }
  return trimmed;
}

function getResetParams(searchParams) {
  const token = normalizeResetToken(searchParams.get('token'));
  const userId = (searchParams.get('userId') ?? '').trim() || null;
  return { token, userId };
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useT();
  const { token, userId } = getResetParams(searchParams);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(null);

  // Live validation: run client-side on every keystroke for instant per-rule feedback
  const updatePasswordValidation = useCallback((pwd) => {
    if (!pwd) {
      setPasswordValidation(null);
      return;
    }
    const rules = validatePasswordClientSide(pwd);
    setPasswordValidation({ valid: Object.values(rules).every(Boolean), rules });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !userId) {
      setStatus('error');
      setErrorMessage(t('auth.invalid_or_expired_reset_link'));
      return;
    }
    if (!newPassword?.trim()) {
      setStatus('error');
      setErrorMessage(t('auth.please_enter_a_new_password'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMessage(t('auth.passwords_do_not_match'));
      return;
    }
    if (passwordValidation && !passwordValidation.valid) {
      setStatus('error');
      setErrorMessage(t('auth.password_must_meet_all_requirements'));
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setErrorMessage('');

    try {
      const identityBaseUrl = getIdentityBaseUrl();
      const response = await fetch(`${identityBaseUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          userId,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        const errMsg = data.error || (Array.isArray(data.errors) ? data.errors.join('. ') : null)
          || (t('auth.failed_to_reset_password'));
        setErrorMessage(errMsg);
        return;
      }

      setStatus('success');
      setTimeout(() => navigate('/login?passwordReset=1', { replace: true }), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : (t('auth.could_not_reach_the_server')));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            <LangText path="auth.invalid_reset_link"  />
          </h2>
          <p className="text-muted-foreground mb-6">
            <LangText path="auth.this_password_reset_link_is_invalid_or_has_expired_please_re"
            />
          </p>
          <Link to="/forgot-password">
            <Button variant="outline">
              <LangText path="auth.request_new_link"  />
            </Button>
          </Link>
          <p className="mt-4">
            <Link to="/login" className="text-primary hover:underline">
              <LangText path="auth.backToSignIn"  />
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative">
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
            <LangText path="auth.set_a_new_password"
            />
          </h1>
          <p className="text-lg text-foreground max-w-md">
            <LangText path="auth.enter_your_new_password_below_it_must_meet_the_security_requ"
            />
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-12" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              <LangText path="auth.reset_password"  />
            </h2>
          </div>

          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <LangText path="auth.password_has_been_reset_successfully_redirecting_to_sign_in"
                />
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  <LangText path="auth.new_password"  />
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('accountSettings.newPasswordPlaceholder')}
                    className="pl-10 pr-12 h-11"
                    value={newPassword}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewPassword(v);
                      updatePasswordValidation(v);
                    }}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PASSWORD_RULE_ORDER.map((key) => {
                    const ok = passwordValidation?.rules?.[key] ?? false;
                    const label = PASSWORD_RULE_LABELS[key]?.[t('auth.en')] ?? key;
                    return (
                      <div key={key} className={ok ? 'text-green-600 dark:text-green-400 text-sm' : 'text-muted-foreground text-sm'}>
                        {ok ? '✓' : '○'} {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <LangText path="auth.confirm_password"  />
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirm_new_password')}
                    className="pl-10 pr-12 h-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 shadow-soft"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ButtonLoader />
                    <LangText path="auth.resetting"  />
                  </>
                ) : (
                  <LangText path="auth.reset_password"  />
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/login" className="text-primary font-medium hover:underline">
              <LangText path="auth.backToSignIn"  />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
