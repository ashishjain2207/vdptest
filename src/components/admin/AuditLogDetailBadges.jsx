import { Badge } from '@imriva/framework';
import { cn } from '@/lib/utils';

/** @typedef {import('@/lib/auditLogPresentation').AuditDetailItem} AuditDetailItem */

const toneClasses = {
  default: 'border-border bg-muted/50 text-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  muted: 'border-border bg-muted/30 text-muted-foreground',
};

/**
 * @param {{ items: AuditDetailItem[], compact?: boolean, className?: string }} props
 */
export default function AuditLogDetailBadges({ items, compact = false, className }) {
  if (!items?.length) {
    return null;
  }

  const visible = compact ? items.slice(0, 2) : items;
  const hiddenCount = compact ? Math.max(0, items.length - visible.length) : 0;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((item) => (
        <Badge
          key={item.key}
          variant="outline"
          className={cn(
            'max-w-full font-normal whitespace-normal text-left leading-snug',
            toneClasses[item.tone ?? 'default'],
          )}
          title={`${item.label}: ${item.value}`}
        >
          <span className="font-medium">{item.label}:</span>
          {' '}
          <span className={item.key === '_raw' ? 'break-all' : ''}>{item.value}</span>
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Badge variant="secondary" className="font-normal">
          +{hiddenCount}
        </Badge>
      ) : null}
    </div>
  );
}
