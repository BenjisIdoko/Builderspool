import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton } from '@/components/skeletons';

export default function SellerPayoutsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-12">
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="mb-2 h-6 w-40" />
      <Skeleton className="mb-6 h-4 w-96 max-w-full" />
      <KpiRowSkeleton count={3} />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
