import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton } from '@/components/skeletons';

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="mb-3 h-3 w-32" />
      <Skeleton className="mb-8 h-7 w-72" />
      <KpiRowSkeleton count={5} />
      <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
