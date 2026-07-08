import { useState, useEffect, useCallback, useRef } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import {
  Button,
  Input,
  Label,
  Separator,
  Badge,
} from '@imriva/framework';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Check, CheckCircle2, Eye, EyeOff, Lock, Mail, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams } from '@/i18n';
import { LangText } from '@/components/ui/LangText';
import { getAccessToken, getUserInfoFromIdentity, resolveHasPasswordFromUserInfo } from '@/services';
import { config } from '@/services/config';
import { cn } from '@/lib/utils';

const PASSWORD_RULE_ORDER = ['length', 'uppercase', 'lowercase', 'digit', 'nonAlphanumeric'];

// Client-side validation - runs on every keystroke for instant feedback
const validatePasswordClientSide = (p) => ({
  length: (p ?? '').length >= 8,
  uppercase: /[A-Z]/.test(p ?? ''),
  lowercase: /[a-z]/.test(p ?? ''),
  digit: /\d/.test(p ?? ''),
  nonAlphanumeric: /[^A-Za-z0-9]/.test(p ?? ''),
});

const AccountSettings = () => {
  const { language } = useLanguage();
  const t = useT();
  const tParams = useTParams();
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newEmailFieldActive, setNewEmailFieldActive] = useState(false);
  const newEmailTouchedRef = useRef(false);

  // Live validation: run client-side on every keystroke for instant per-rule feedback
  const updatePasswordValidation = useCallback((pwd) => {
    if (!pwd) {
      setPasswordValidation(null);
      return;
    }
    const rules = validatePasswordClientSide(pwd);
    setPasswordValidation({ valid: Object.values(rules).every(Boolean), rules });
  }, []);

  const loadEmail = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setEmailLoading(false);
      return;
    }
    setEmailLoading(true);
    try {
      const userInfo = await getUserInfoFromIdentity(token);
      if (userInfo?.email) {
        setEmail((prev) => {
          if (prev && prev !== userInfo.email) {
            setNewEmail('');
            newEmailTouchedRef.current = false;
          }
          return userInfo.email;
        });
      }
      if (!newEmailTouchedRef.current) {
        setNewEmail('');
      }
      if (userInfo) {
        setHasPassword(resolveHasPasswordFromUserInfo(userInfo));
      }
    } finally {
      setEmailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmail();
  }, [loadEmail]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadEmail();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadEmail]);

  const canManageLoginCredentials = hasPassword !== false;

  const handleEmailChange = async () => {
    if (!canManageLoginCredentials) {
      toast.error(t('settings.you_signed_in_with_google_microsoft_or_linkedin_email_change'));
      return;
    }
    const toSend = (newEmail || '').trim();
    if (!toSend) {
      toast.error(t('settings.enter_a_new_email_address'));
      return;
    }
    if (email && toSend.toLowerCase() === email.toLowerCase()) {
      toast.error(t('settings.please_enter_a_different_email_address_this_is_your_current_'));
      return;
    }
    const token = getAccessToken();
    if (!token) {
      toast.error(t('settings.please_sign_in_to_change_your_email'));
      return;
    }
    setEmailChangeLoading(true);
    try {
      // Call Identity on the same host as the OIDC issuer (local in dev when using defaults).
      const identityBaseUrl = config.oidc.authBase;
      const response = await fetch(`${identityBaseUrl}/api/account/change-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: toSend }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          data?.error ||
          data?.message ||
          data?.errors?.join?.(', ') ||
          (response.status === 405
            ? (t('settings.proxy_or_server_config_error_405_restart_the_dev_server_and_'))
            : language === 'EN'
              ? `Failed to send verification email (${response.status})`
              : `E-Mail konnte nicht gesendet werden (${response.status})`);
        toast.error(msg);
        return;
      }
      toast.success(t('settings.verification_email_sent_to_your_new_address'));
      setNewEmail('');
      newEmailTouchedRef.current = false;
    } catch (err) {
      const msg = err?.message || (t('settings.failed_to_send_verification_email'));
      toast.error(msg);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!canManageLoginCredentials) {
      toast.error(t('settings.you_signed_in_with_google_microsoft_or_linkedin_password_cha'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwords_do_not_match'));
      return;
    }
    if (!currentPassword?.trim()) {
      toast.error(t('settings.enter_your_current_password'));
      return;
    }
    if (!newPassword?.trim()) {
      toast.error(t('settings.enter_a_new_password'));
      return;
    }
    if (passwordValidation && !passwordValidation.valid) {
      toast.error(t('settings.password_must_meet_all_requirements_above'));
      return;
    }
    const token = getAccessToken();
    if (!token) {
      toast.error(t('settings.please_sign_in_to_change_your_password'));
      return;
    }
    setPasswordChangeLoading(true);
    try {
      const changePasswordUrl = import.meta.env.DEV
        ? '/api-identity/api/account/change-password'
        : `${config.oidc.issuer.replace(/\/$/, '')}/api/account/change-password`;
      const response = await fetch(changePasswordUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          data?.error ||
          (Array.isArray(data?.errors) ? data.errors.join('. ') : null) ||
          (tParams('validation.passwordChangeFailedStatus', { status: response.status }));
        toast.error(msg);
        return;
      }
      toast.success(t('settings.password_updated_successfully'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordValidation(null);
    } catch (err) {
      toast.error(err?.message || (t('settings.failed_to_change_password')));
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    toast.error(t('settings.account_deletion_is_disabled_in_demo_mode'));
  };

  return (
    <SettingsLayout
      title={t('accountSettings.title')}
      description={t('accountSettings.description')}
    >
      <div className="space-y-8">
        {/* Email Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium text-foreground"><LangText path="settings.email_address"  /></h3>
          </div>
          
          <div className="p-4 bg-secondary/30 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{emailLoading ? '…' : (email || '—')}</p>
                <p className="text-sm text-muted-foreground"><LangText path="settings.primary_email_address"  /></p>
              </div>
              {!emailLoading && email && (
                <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600">
                  <Check className="w-3 h-3" />
                  <LangText path="common.verified"  />
                </Badge>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="new-email"><LangText path="accountSettings.changeEmail"  /></Label>
              {emailLoading ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : canManageLoginCredentials ? (
                <div className="flex gap-2">
                  <Input
                    key={email}
                    id="new-email"
                    name="imriva-account-new-email"
                    type="email"
                    inputMode="email"
                    value={newEmail}
                    onChange={(e) => {
                      newEmailTouchedRef.current = true;
                      setNewEmail(e.target.value);
                    }}
                    placeholder={t('accountSettings.newEmailPlaceholder')}
                    className="flex-1"
                    disabled={emailChangeLoading}
                    autoComplete="new-email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    readOnly={!newEmailFieldActive}
                    onFocus={() => setNewEmailFieldActive(true)}
                  />
                  <Button variant="outline" onClick={handleEmailChange} disabled={emailChangeLoading}>
                    {emailChangeLoading ? (t('auth.sendingResetLink')) : <LangText path="accountSettings.updateEmail"  />}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <LangText path="settings.you_signed_in_with_google_microsoft_or_linkedin_email_change"  />
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Password Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium text-foreground"><LangText path="auth.password"  /></h3>
          </div>
          
          <div className="p-4 bg-secondary/30 rounded-lg space-y-4">
            {emailLoading ? (
              <p className="text-sm text-muted-foreground">…</p>
            ) : canManageLoginCredentials ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password"><LangText path="settings.current_password"  /></Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('accountSettings.currentPasswordPlaceholder')}
                        className="pr-12"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label={showCurrentPassword
                          ? (t('settings.hide_current_password'))
                          : (t('settings.show_current_password'))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPassword((s) => !s)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password"><LangText path="settings.new_password"  /></Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewPassword(v);
                          updatePasswordValidation(v);
                        }}
                        placeholder={t('accountSettings.newPasswordPlaceholder')}
                        className={cn(
                          'pr-12',
                          newPassword && passwordValidation && !passwordValidation.valid ? 'border-destructive focus-visible:ring-destructive' : '',
                        )}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        aria-label={showNewPassword
                          ? (t('settings.hide_new_password'))
                          : (t('settings.show_new_password'))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword((s) => !s)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password"><LangText path="settings.confirm_new_password"  /></Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth.confirm_new_password')}
                        className={cn(
                          'pr-12',
                          confirmPassword && newPassword && confirmPassword !== newPassword ? 'border-destructive focus-visible:ring-destructive' : '',
                        )}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword
                          ? (t('settings.hide_confirm_password'))
                          : (t('settings.show_confirm_password'))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p
                        className={`text-xs flex items-center gap-1.5 ${confirmPassword === newPassword ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}
                      >
                        {confirmPassword === newPassword ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <LangText path="settings.passwords_match"  />
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <LangText path="auth.passwords_do_not_match"  />
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {PASSWORD_RULE_ORDER.map((ruleId) => {
                    const passed = passwordValidation?.rules?.[ruleId] ?? false;
                    return (
                      <p
                        key={ruleId}
                        className={`text-xs flex items-center gap-1.5 ${passed ? 'text-green-600 dark:text-green-500' : newPassword ? 'text-destructive' : 'text-muted-foreground'}`}
                      >
                        {passed ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        {t(`passwordRules.${ruleId}`)}
                      </p>
                    );
                  })}
                </div>
                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    passwordChangeLoading ||
                    (newPassword && passwordValidation && !passwordValidation.valid) ||
                    (newPassword && confirmPassword && newPassword !== confirmPassword)
                  }
                >
                  {passwordChangeLoading ? (t('settings.updating')) : <LangText path="settings.change_password"  />}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                <LangText path="settings.you_signed_in_with_google_microsoft_or_linkedin_password_cha"
                />
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-medium"><LangText path="accountSettings.dangerZone"  /></h3>
          </div>
          
          <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground"><LangText path="settings.delete_account"  /></p>
                <p className="text-sm text-muted-foreground">
                  <LangText path="accountSettings.deleteAccountDescription"  />
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    <LangText path="settings.delete_account"  />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle><LangText path="settings.are_you_absolutely_sure"  /></AlertDialogTitle>
                    <AlertDialogDescription>
                      <LangText path="settings.this_action_cannot_be_undone_this_will_permanently_delete_yo"  />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel><LangText path="common.cancel"  /></AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <LangText path="settings.delete_account"  />
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default AccountSettings;
