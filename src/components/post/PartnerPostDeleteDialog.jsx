import { useEffect, useState } from 'react';
import { Textarea } from '@imriva/framework';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Delete confirmation for posts. Partner moderators/admins must enter a reason when deleting another member's post.
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   isAuthor: boolean,
 *   requiresModerationReason: boolean,
 *   onConfirm: (reason?: string) => Promise<void>,
 *   reasonFieldId?: string,
 *   stopPropagationOnContent?: boolean,
 * }} props
 */
export function PartnerPostDeleteDialog({
  open,
  onOpenChange,
  isAuthor,
  requiresModerationReason,
  onConfirm,
  reasonFieldId = 'post-delete-reason',
  stopPropagationOnContent = false,
}) {
  const { language } = useLanguage();
  const t = useT();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReasonError, setShowReasonError] = useState(false);
  const trimmedReason = reason.trim();
  const canDelete = !requiresModerationReason || trimmedReason.length > 0;

  useEffect(() => {
    if (!open) {
      setReason('');
      setSubmitting(false);
      setShowReasonError(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiresModerationReason && !trimmedReason) {
      setShowReasonError(true);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(requiresModerationReason ? trimmedReason : undefined);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || (t('posts.failed_to_delete')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        {...(stopPropagationOnContent
          ? { onClick: (e) => e.stopPropagation() }
          : {})}
      >
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <LangText path="posts.delete_post"  />
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAuthor ? (
                <LangText path="posts.this_action_cannot_be_undone_this_will_permanently_delete_yo"
                />
              ) : (
                <LangText path="posts.this_action_cannot_be_undone_this_post_will_be_permanently_r"
                />
              )}
            </AlertDialogDescription>
            {requiresModerationReason ? (
              <div className="mt-3 space-y-1.5 text-left">
                <label htmlFor={reasonFieldId} className="text-sm font-medium text-foreground">
                  <LangText path="posts.deletion_reason"  />
                  <span className="text-destructive" aria-hidden> *</span>
                </label>
                <Textarea
                  id={reasonFieldId}
                  name="deletionReason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) {
                      setShowReasonError(false);
                    }
                  }}
                  placeholder={
                    language === 'EN'
                      ? 'Enter deletion reason…'
                      : 'Löschgrund eingeben…'
                  }
                  rows={3}
                  maxLength={500}
                  aria-required="true"
                  aria-invalid={showReasonError}
                  disabled={submitting}
                  className={cn(
                    'resize-none',
                    showReasonError && 'border-destructive focus-visible:ring-destructive',
                  )}
                  onClick={stopPropagationOnContent ? (e) => e.stopPropagation() : undefined}
                />
                {showReasonError ? (
                  <p className="text-sm text-destructive" role="alert">
                    <LangText path="posts.please_make_sure_to_enter_a_deletion_reason"
                    />
                  </p>
                ) : null}
              </div>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button" disabled={submitting}>
              <LangText path="common.cancel"  />
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={submitting || !canDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <LangText path="messages.delete"  />
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
