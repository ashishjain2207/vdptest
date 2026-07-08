import { Skeleton } from '@/components/ui/skeleton';

export function FeedPostSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5 max-w-[320px]" />
        <Skeleton className="h-4 w-3/5 max-w-[240px]" />
      </div>
      <div className="flex gap-6 pt-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}
