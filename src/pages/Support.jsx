import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Mail, User, Loader2, CheckCircle2, LifeBuoy, MessageCircle, Send, X } from 'lucide-react';
import { Button, Input, Label } from '@imriva/framework';
import { LegalDocumentLayout } from '@/components/layout/LegalDocumentLayout';
import { LangText } from '@/components/ui/LangText';
import { FieldError } from '@/components/ui/FieldError';
import { SupportCategorySelect } from '@/components/support/SupportCategorySelect';
import { useAuth } from '@/contexts/AuthContext';
import { submitSupportInquiry } from '@/services/supportInquiryService';
import {
  validateSupportForm,
  isSupportFormValid,
  SUPPORT_MIN_MESSAGE_LENGTH,
  SUPPORT_MAX_MESSAGE_LENGTH,
  FEEDBACK_CATEGORIES,
  SUPPORT_CATEGORIES,
} from '@/lib/supportFormValidation';
import { resolveSupportInquiryTypeFromRoute, resolveSupportSubmitterFromSession } from '@/lib/supportRoutes';
import { getAccessToken } from '@/services';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useT, useTParams } from '@/i18n';

function RequiredMark() {
  return <span className="text-destructive ml-0.5" aria-hidden>*</span>;
}

const Support = () => {
  const { user } = useAuth();
  const tr = useTParams();
  const t = useT();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const presetType = resolveSupportInquiryTypeFromRoute(searchParams, location.state);
  const isFeedback = presetType === 'Feedback';
  const isSupport = presetType === 'Support';
  const typeLocked = isFeedback || isSupport;

  const from =
    typeof location.state?.from === 'string'
      ? location.state.from
      : user
        ? '/posts'
        : '/login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState(presetType || '');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(/** @type {Record<string, boolean>} */ ({}));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /** @type {'Support' | 'Feedback' | null} */
  const [submittedInquiryType, setSubmittedInquiryType] = useState(null);

  const submittedIsFeedback = submittedInquiryType === 'Feedback';

  const categories = isSupport || inquiryType === 'Support' ? SUPPORT_CATEGORIES : FEEDBACK_CATEGORIES;

  const formFields = useMemo(
    () => ({ name, email, inquiryType, category, message, subject }),
    [name, email, inquiryType, category, message, subject],
  );

  const canSubmit = useMemo(() => isSupportFormValid(formFields, tr), [formFields, tr]);

  const visibleErrors = useMemo(() => {
    const all = validateSupportForm(formFields, tr);
    if (submitAttempted) {
      return all;
    }
    /** @type {Record<string, string>} */
    const shown = {};
    for (const key of Object.keys(all)) {
      if (touched[key]) {
        shown[key] = all[key];
      }
    }
    return shown;
  }, [formFields, tr, submitAttempted, touched]);

  useEffect(() => {
    if (presetType) {
      setInquiryType(presetType);
    }
  }, [presetType]);

  const mappedSubmitter = useMemo(
    () => resolveSupportSubmitterFromSession(user, getAccessToken()),
    [user],
  );

  useEffect(() => {
    if (!user?.userId) {
      return;
    }
    if (mappedSubmitter.name) {
      setName((prev) => prev || mappedSubmitter.name);
    }
    if (mappedSubmitter.email) {
      setEmail((prev) => prev || mappedSubmitter.email);
    }
  }, [user?.userId, mappedSubmitter.name, mappedSubmitter.email]);

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({
      inquiryType: true,
      name: true,
      email: true,
      category: true,
      message: true,
      subject: true,
    });
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      await submitSupportInquiry({
        submitterName: name.trim(),
        submitterEmail: email.trim(),
        inquiryType,
        category,
        subject: inquiryType === 'Support' ? subject.trim() : undefined,
        message: message.trim(),
      });
      setSubmittedInquiryType(inquiryType === 'Feedback' ? 'Feedback' : 'Support');
      setSubmitted(true);
      const toastMsg = inquiryType === 'Feedback'
        ? t('support.thank_you_for_your_feedback')
        : t('support.thank_you_for_contacting_support');
      toast.success(toastMsg);
    } catch (err) {
      toast.error(err?.message || t('support.submissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const showError = (field) => visibleErrors[field];
  const backHref = from === '/signup' ? '/signup' : from === '/login' ? '/login' : user ? '/posts' : '/login';
  const messageLen = message.length;

  return (
    <LegalDocumentLayout>
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {submitted ? (
            submittedIsFeedback ? <MessageCircle className="h-6 w-6" /> : <LifeBuoy className="h-6 w-6" />
          ) : isFeedback ? (
            <MessageCircle className="h-6 w-6" />
          ) : (
            <LifeBuoy className="h-6 w-6" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground partner-admin-heading">
            {submitted ? (
              submittedIsFeedback ? (
                <LangText path="support.thank_you_for_your_feedback"  />
              ) : (
                <LangText path="support.thank_you_for_contacting_support"  />
              )
            ) : isFeedback ? (
              <LangText path="support.send_feedback"  />
            ) : isSupport ? (
              <LangText path="support.contact_support"  />
            ) : (
              <LangText path="notifications.support_feedback"  />
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submitted ? (
              submittedIsFeedback ? (
                <LangText path="support.we_received_your_feedback_and_will_use_it_to_improve_vdpconn"
                />
              ) : (
                <LangText path="support.we_received_your_request_our_team_will_get_back_to_you_by_em"
                />
              )
            ) : isFeedback ? (
              <LangText path="support.help_us_improve_vdpconnect_share_bugs_ideas_or_anything_on_y"
              />
            ) : isSupport ? (
              <LangText path="support.describe_your_issue_our_team_will_get_back_to_you_by_email"
              />
            ) : (
              <LangText path="support.choose_support_or_feedback_then_send_us_your_message"
              />
            )}
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4 max-w-lg">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
          <p className="text-foreground font-medium">
            {submittedIsFeedback ? (
              <LangText path="support.your_feedback_was_submitted_successfully"
              />
            ) : (
              <LangText path="support.your_support_request_was_submitted_successfully"
              />
            )}
          </p>
          <Button asChild variant="outline">
            <Link to={backHref}>
              <LangText path="layout.back"  />
            </Link>
          </Button>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5 max-w-2xl"
        >
          {!typeLocked ? (
            <div className="space-y-2">
              <Label>
                <LangText path="admin.type"  />
                <RequiredMark />
              </Label>
              <div className={cn('flex flex-wrap gap-4 rounded-lg border p-3', showError('inquiryType') ? 'border-destructive' : 'border-border')}>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="inquiryType" value="Support" checked={inquiryType === 'Support'} onChange={() => { setInquiryType('Support'); setCategory(''); }} required />
                  <LangText path="nav.supportInbox"  />
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="inquiryType" value="Feedback" checked={inquiryType === 'Feedback'} onChange={() => { setInquiryType('Feedback'); setCategory(''); }} required />
                  <LangText path="layout.feedback"  />
                </label>
              </div>
              <FieldError message={showError('inquiryType')} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support-name">
                <LangText path="auth.name"  />
                <RequiredMark />
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="support-name" className={cn('pl-10 h-11', showError('name') && 'border-destructive')} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => handleBlur('name')} autoComplete="name" />
              </div>
              <FieldError message={showError('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">
                <LangText path="auth.email"  />
                <RequiredMark />
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="support-email" type="email" className={cn('pl-10 h-11', showError('email') && 'border-destructive')} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur('email')} autoComplete="email" />
              </div>
              <FieldError message={showError('email')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-category">
              <LangText path="partners.category"  />
              <RequiredMark />
            </Label>
            <SupportCategorySelect
              id="support-category"
              value={category}
              onChange={setCategory}
              onBlur={() => handleBlur('category')}
              options={categories}
              hasError={Boolean(showError('category'))}
            />
            <FieldError message={showError('category')} />
          </div>

          {inquiryType === 'Support' ? (
            <div className="space-y-2">
              <Label htmlFor="support-subject">
                <LangText path="support.subject"  />
                <RequiredMark />
              </Label>
              <Input id="support-subject" className={cn('h-11', showError('subject') && 'border-destructive')} value={subject} onChange={(e) => setSubject(e.target.value)} onBlur={() => handleBlur('subject')} />
              <FieldError message={showError('subject')} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="support-message">
              {inquiryType === 'Support' ? (
                <LangText path="support.how_can_we_help"  />
              ) : (
                <LangText path="messages.message"  />
              )}
              <RequiredMark />
            </Label>
            <textarea
              id="support-message"
              rows={5}
              maxLength={SUPPORT_MAX_MESSAGE_LENGTH}
              className={cn('w-full rounded-lg border bg-card px-3 py-2 text-sm shadow-sm resize-y min-h-[120px]', showError('message') ? 'border-destructive' : 'border-border')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => handleBlur('message')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{tr('support.minChars', { n: SUPPORT_MIN_MESSAGE_LENGTH })}</span>
              <span>{messageLen}/{SUPPORT_MAX_MESSAGE_LENGTH}</span>
            </div>
            <FieldError message={showError('message')} />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="h-11 gap-2" asChild>
              <Link to={backHref}>
                <X className="h-4 w-4" />
                <LangText path="common.cancel"  />
              </Link>
            </Button>
            <Button type="submit" className="h-11 gap-2 shadow-soft" disabled={!canSubmit || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <LangText path="auth.sendingResetLink"  />
                </>
              ) : isFeedback ? (
                <>
                  <Send className="h-4 w-4" />
                  <LangText path="support.submit_feedback"  />
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <LangText path="support.submit_request"  />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </LegalDocumentLayout>
  );
};

export default Support;
