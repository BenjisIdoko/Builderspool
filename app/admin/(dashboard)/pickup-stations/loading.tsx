import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPickupStationsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <Skeleton className="mb-1 h-3 w-40" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-full max-w-2xl" />
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <Skeleton className="mb-8 h-64 max-w-3xl rounded-card" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}
