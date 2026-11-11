import { Skeleton } from '@/components/ui/skeleton';

export default function SellerRfqsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-5xl">
      <Skeleton className="mb-2 h-3 w-32" />
      <Skeleton className="mb-2 h-8 w-24" />
      <Skeleton className="mb-6 h-4 w-full max-w-lg" />
      <div className="divide-y divide-border overflow-hidden rounded-lg bg-card-alt">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 px-5 py-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
