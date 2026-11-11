import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton } from '@/components/skeletons';

export default function SellerPayoutsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <Skeleton className="mb-2 h-3 w-28" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="mb-6 h-4 w-full max-w-lg" />
      <KpiRowSkeleton count={3} />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
