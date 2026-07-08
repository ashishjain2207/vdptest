import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { Loader } from '@/components/ui/loader';
import { config } from '@/services/config';

function getIdentityBaseUrl() {
  if (import.meta.env.DEV) {
    return '/api-identity';
  }
  return config.oidc.issuer.replace(/\/$/, '');
}

export function VerifyEmail() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState(null); // 'idle' | 'sending' | 'success' | 'error'
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      // Support both 'userId' and common typo 'userld' so links still work
      const userId = searchParams.get('userId') ?? searchParams.get('userld');
      const resendOnly = searchParams.get('resend') === '1';

      if (!token || !userId) {
        if (resendOnly) {
          setStatus('resend');
          setErrorMessage(null);
          return;
        }

        setStatus('error');
        setErrorMessage(t('auth.invalidVerificationLink'));
        return;
      }

      try {
        const identityBaseUrl = getIdentityBaseUrl();
        const response = await fetch(`${identityBaseUrl}/api/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
          throw new Error(errorData.error || errorData.errors?.join(', ') || 'Verification failed');
        }

        setStatus('success');
        redirectTimeoutRef.current = setTimeout(() => navigate('/login', { replace: true }), 3000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : t('auth.verificationFailedRetry'));
      }
    };

    verifyEmail();
    return () => {
      if (redirectTimeoutRef.current) { clearTimeout(redirectTimeoutRef.current); }
    };
  }, [searchParams, navigate, t]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const userIdFromLink = searchParams.get('userId') || undefined;

  const handleResendVerification = async () => {
    const identityBaseUrl = getIdentityBaseUrl();
    const body = userIdFromLink ? { userId: userIdFromLink } : { email: resendEmail?.trim() };
    if (!body.userId && !body.email) {
      setResendStatus('error');
      setResendMessage(t('auth.enterEmailForResend'));
      return;
    }
    setResendStatus('sending');
    setResendMessage('');
    try {
      const response = await fetch(`${identityBaseUrl}/api/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setResendStatus('error');
        setResendMessage(data.error || t('auth.resendVerificationFailed'));
        return;
      }
      setResendStatus('success');
      setResendMessage(data.message || t('auth.verificationEmailSent'));
    } catch {
      setResendStatus('error');
      setResendMessage(t('auth.serverUnreachable'));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {status === 'loading' && (
            <div className="text-center">
              <Loader size="xl" variant="primary" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                <LangText path="auth.verifying_your_email"  />
              </h2>
              <p className="text-muted-foreground">
                <LangText path="auth.please_wait_while_we_verify_your_email_address"
                />
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">
                <LangText path="auth.email_verified"  />
              </h2>
              <p className="text-muted-foreground mb-6">
                <LangText path="auth.your_email_address_has_been_successfully_verified_you_can_no"
                />
              </p>
              <Button onClick={handleGoToLogin} className="w-full">
                <LangText path="auth.go_to_sign_in"  />
              </Button>
            </div>
          )}

          {(status === 'error' || status === 'resend') && (
            <div className="text-center">
              {status === 'error' && (
                <>
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h2 className="text-2xl font-bold mb-2">
                    <LangText path="auth.verification_failed"  />
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {errorMessage || (
                      <LangText path="auth.the_verification_link_is_invalid_or_has_expired_please_reque"
                      />
                    )}
                  </p>
                </>
              )}

              {status === 'resend' && (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    <LangText path="auth.resend_verification_email"  />
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    <LangText path="auth.enter_your_email_address_and_we_will_send_a_new_verification"
                    />
                  </p>
                </>
              )}

              <div className="mb-6 p-4 bg-muted/50 rounded-lg text-left space-y-3">
                <p className="text-sm font-medium">
                  <LangText path="auth.resend_verification_email"  />
                </p>
                {!userIdFromLink && (
                  <input
                    type="email"
                    placeholder={t('auth.your_email')}
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    disabled={resendStatus === 'sending'}
                  />
                )}
                <Button
                  onClick={handleResendVerification}
                  variant="secondary"
                  className="w-full"
                  disabled={resendStatus === 'sending'}
                >
                  {resendStatus === 'sending' ? (
                    <LangText path="auth.sendingResetLink"  />
                  ) : (
                    <LangText path="auth.resend_verification_email"  />
                  )}
                </Button>
                {resendStatus === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400">{resendMessage}</p>
                )}
                {resendStatus === 'error' && (
                  <p className="text-sm text-destructive">{resendMessage}</p>
                )}
              </div>

              <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                <LangText path="auth.go_to_sign_in"  />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
