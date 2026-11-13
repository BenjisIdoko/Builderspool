import { Skeleton } from '@/components/ui/skeleton';

export default function SellerListingsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-3xl">
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="mb-6 h-4 w-full max-w-lg" />
      <Skeleton className="mb-6 h-80 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
