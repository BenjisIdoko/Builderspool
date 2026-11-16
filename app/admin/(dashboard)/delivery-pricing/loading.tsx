import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDeliveryPricingLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <Skeleton className="mb-1 h-3 w-40" />
      <Skeleton className="mb-2 h-8 w-52" />
      <Skeleton className="mb-6 h-4 w-full max-w-2xl" />
      <Skeleton className="mb-8 h-40 max-w-3xl rounded-card" />
      <Skeleton className="mb-8 h-72 rounded-card" />
      <Skeleton className="h-96 rounded-card" />
    </div>
  );
}
