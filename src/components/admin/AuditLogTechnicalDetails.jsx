import { useState } from 'react';
import { Button } from '@imriva/framework';
import { ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { LangText } from '@/components/ui/LangText';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useT } from '@/i18n';
import { buildAuditTechnicalPayload } from '@/lib/auditLogPresentation';
import { cn } from '@/lib/utils';

/**
 * @param {{ row: Record<string, unknown>, defaultOpen?: boolean, className?: string }} props
 */
export default function AuditLogTechnicalDetails({ row, defaultOpen = false, className }) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  const payload = buildAuditTechnicalPayload(row);
  const json = JSON.stringify(payload, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast.success(t('adminAuditLogs.copied'));
    } catch {
      toast.error(t('adminAuditLogs.copyFailed'));
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
            <LangText path={open ? 'adminAuditLogs.hideTechnicalDetails' : 'adminAuditLogs.viewTechnicalDetails'} />
          </Button>
        </CollapsibleTrigger>
        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={copy}>
          <Copy className="h-4 w-4" aria-hidden />
          <LangText path="adminAuditLogs.copyTechnicalDetails" />
        </Button>
      </div>
      <CollapsibleContent className="mt-3 space-y-3">
        <dl className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground"><LangText path="adminAuditLogs.eventId" /></dt>
            <dd className="mt-0.5 font-mono break-all text-foreground">{payload.eventId || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground"><LangText path="adminAuditLogs.actorId" /></dt>
            <dd className="mt-0.5 font-mono break-all text-foreground">{payload.actorUserId || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground"><LangText path="adminAuditLogs.entityType" /></dt>
            <dd className="mt-0.5 break-all text-foreground">{payload.entityType || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground"><LangText path="adminAuditLogs.entityIdLabel" /></dt>
            <dd className="mt-0.5 font-mono break-all text-foreground">{payload.entityId || '—'}</dd>
          </div>
        </dl>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            <LangText path="adminAuditLogs.rawDetails" />
          </p>
          <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap break-all">
            {json}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
