import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button, Input, Label } from '@imriva/framework';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LangText } from '@/components/ui/LangText';
import { ButtonLoader } from '@/components/ui/loader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { config } from '@/services/config';

function getIdentityBaseUrl() {
  if (import.meta.env.DEV) {
    return '/api-identity';
  }
  return config.oidc.issuer.replace(/\/$/, '');
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) {
      setStatus('error');
      setMessage(t('auth.please_enter_your_email_address'));
      return;
    }

    setIsLoading(true);
    setStatus(null);
    setMessage('');
    setResetLink(null);

    try {
      const identityBaseUrl = getIdentityBaseUrl();
      const response = await fetch(`${identityBaseUrl}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || (t('auth.failed_to_send_reset_email')));
        return;
      }

      setStatus('success');
      setMessage(data.message || (language === 'EN'
        ? 'If an account exists with that email, you will receive a password reset link shortly. Please check your inbox and spam folder.'
        : 'Falls ein Konto mit dieser E-Mail existiert, erhalten Sie in Kürze einen Link zum Zurücksetzen. Bitte prüfen Sie Ihren Posteingang und den Spam-Ordner.'));
      setResetLink(data.resetLink || null);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : (t('auth.could_not_reach_the_server')));
    } finally {
      setIsLoading(false);
    }
  };

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
            <LangText path="auth.resetPassword"
            />
          </h1>
          <p className="text-lg text-foreground max-w-md">
            <LangText path="auth.resetPasswordInstructions"
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

          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <LangText path="auth.backToSignIn"  />
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              <LangText path="auth.resetPassword"  />
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              <LangText path="auth.resetPasswordInstructions"
              />
            </p>
          </div>

          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
              {resetLink && (
                <a
                  href={resetLink}
                  className="text-sm text-primary font-medium hover:underline block break-all"
                >
                  {t('auth.click_here_to_reset_your_password')}
                </a>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <LangText path="auth.emailAddress"  />
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.name_company_com')}
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
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
                    <LangText path="auth.sendingResetLink"  />
                  </>
                ) : (
                  <LangText path="auth.sendResetLink"  />
                )}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <Button onClick={() => navigate('/login')} className="w-full h-11">
              <LangText path="auth.backToSignIn"  />
            </Button>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            <LangText path="auth.rememberPassword"  />{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              <LangText path="auth.signIn"  />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
