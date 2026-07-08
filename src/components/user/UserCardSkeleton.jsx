import { Skeleton } from '@/components/ui/skeleton';

export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md shrink-0" />
    </div>
  );
}
