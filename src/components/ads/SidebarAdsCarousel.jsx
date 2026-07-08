import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlatformAdCard } from '@/components/ads/PlatformAdCard';
import { cn } from '@/lib/utils';
import { LangText } from '@/components/ui/LangText';

/** Default auto-advance interval for sidebar ads (ms). */
export const DEFAULT_SIDEBAR_AD_ROTATION_MS = 5000;

/**
 * Rotates through multiple right-sidebar platform ads on a timer.
 * Single ad: no rotation UI. Multiple: auto-swipe + dot indicators (pause on hover).
 *
 * @param {{ ads: Array<Record<string, unknown>>, intervalMs?: number, className?: string }} props
 */
export function SidebarAdsCarousel({
  ads,
  intervalMs = DEFAULT_SIDEBAR_AD_ROTATION_MS,
  className = '',
}) {
  const list = useMemo(() => (Array.isArray(ads) ? ads.filter(Boolean) : []), [ads]);
  const listIdsKey = useMemo(
    () => list.map((a) => String(a?.id ?? a?.Id ?? '')).join(','),
    [list],
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [listIdsKey]);

  const advance = useCallback(() => {
    setIndex((i) => (list.length <= 0 ? 0 : (i + 1) % list.length));
  }, [list.length]);

  useEffect(() => {
    if (list.length <= 1 || paused) {
      return undefined;
    }
    const t = window.setInterval(advance, intervalMs);
    return () => window.clearInterval(t);
  }, [list.length, intervalMs, paused, advance]);

  if (list.length === 0) {
    return null;
  }

  const current = list[index] ?? list[0];
  const id = String(current?.id ?? current?.Id ?? index);

  if (list.length === 1) {
    return (
      <div className={className}>
        <PlatformAdCard ad={current} variant="sidebar" />
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-2', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Advertising"
    >
      <div className="relative min-h-[1px] overflow-hidden">
        <div key={id}>
          <PlatformAdCard ad={current} variant="sidebar" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 px-1" role="tablist">
        <span className="sr-only">
          <LangText path="ads.advertisement_carousel"
          />
        </span>
        {list.map((_, i) => (
          <button
            key={String(list[i]?.id ?? list[i]?.Id ?? i)}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
              i === index ? 'w-6 bg-red-500' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600',
            )}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
