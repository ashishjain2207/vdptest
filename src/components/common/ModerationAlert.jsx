import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@imriva/framework';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ModerationAlert({ title, message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-foreground">
      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <AlertTitle className="text-destructive">{title}</AlertTitle>
          <AlertDescription className="text-foreground">
            <p>{message}</p>
          </AlertDescription>
        </div>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss moderation message"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
