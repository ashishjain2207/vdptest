import { Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@imriva/framework';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { supportFormPath } from '@/lib/supportRoutes';

/** Feedback entry in the main / admin header (after notifications). */
export function HeaderFeedbackButton() {
  const location = useLocation();
  const t = useT();
  const from = location.pathname + location.search;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground"
      asChild
    >
      <Link
        to={supportFormPath('feedback')}
        state={{ from }}
        aria-label={t('layout.sendFeedback')}
        title={t('layout.feedback')}
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        <span className="sr-only">
          <LangText path="layout.feedback"  />
        </span>
      </Link>
    </Button>
  );
}
