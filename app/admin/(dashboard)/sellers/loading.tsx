import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton } from '@/components/skeletons';

export default function AdminSellersLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <Skeleton className="mb-1 h-3 w-32" />
      <Skeleton className="mb-2 h-7 w-72" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      <KpiRowSkeleton count={3} />
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
