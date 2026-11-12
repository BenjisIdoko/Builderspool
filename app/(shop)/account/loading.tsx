import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLoading() {
  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-12">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <Skeleton className="h-11 lg:h-80 lg:rounded-card" />
        <div>
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="mb-6 h-4 w-28" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-card" />
            ))}
          </div>
          <Skeleton className="mt-4 h-56 rounded-card" />
        </div>
      </div>
    </div>
  );
}
