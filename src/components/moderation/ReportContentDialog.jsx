import { useState } from 'react';
import { Button, Textarea } from '@imriva/framework';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { submitContentReport } from '@/services/contentReportService';

const MIN_REASON = 10;
const MAX_REASON = 500;

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   contentType: 'Post' | 'Comment' | 'User',
 *   contentId: string,
 * }} props
 */
export function ReportContentDialog({ open, onOpenChange, contentType, contentId }) {
  const t = useT();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= MIN_REASON && trimmed.length <= MAX_REASON && Boolean(contentId);

  const handleOpenChange = (next) => {
    if (!submitting) {
      if (!next) {
        setReason('');
      }
      onOpenChange(next);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await submitContentReport({
        contentType,
        contentId: String(contentId),
        reason: trimmed,
      });
      toast.success(t('moderation.reportSubmitted'));
      setReason('');
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.message || t('moderation.reportFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-600" aria-hidden />
            <LangText path="moderation.reportTitle" />
          </DialogTitle>
          <DialogDescription>
            <LangText path="moderation.reportDescription" />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="report-reason" className="text-sm font-medium text-foreground">
            <LangText path="moderation.reportReasonLabel" />
          </label>
          <Textarea
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('moderation.reportReasonPlaceholder')}
            rows={4}
            maxLength={MAX_REASON}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            {trimmed.length}/{MAX_REASON}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            <LangText path="common.cancel" />
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <LangText path="common.saving" /> : <LangText path="moderation.reportSubmit" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
