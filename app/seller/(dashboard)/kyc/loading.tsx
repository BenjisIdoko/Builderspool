import { Skeleton } from '@/components/ui/skeleton';

export default function SellerKycLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-2xl">
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-full max-w-md" />
      <Skeleton className="mb-6 h-16 w-full rounded-lg" />
      <div className="space-y-4 rounded-lg bg-card-alt p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
