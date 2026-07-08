import { cn } from '@/lib/utils';

/**
 * Animated 3-dots typing indicator. Shows when the other user is typing.
 */
export function TypingIndicator({ displayName, className }) {
  return (
    <div className={cn('flex justify-start', className)}>
      <div className="flex items-center gap-2 max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-muted border border-border shadow-sm">
        <div className="flex gap-1.5 items-end">
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/70" />
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/70" />
          <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/70" />
        </div>
        {displayName && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{displayName}</span>
        )}
      </div>
    </div>
  );
}
