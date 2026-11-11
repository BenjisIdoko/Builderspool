import { Skeleton } from '@/components/ui/skeleton';

export default function SellerBidsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-5xl">
      <Skeleton className="mb-2 h-3 w-32" />
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="mb-6 h-4 w-full max-w-md" />
      <div className="divide-y divide-border overflow-hidden rounded-lg bg-card-alt">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
