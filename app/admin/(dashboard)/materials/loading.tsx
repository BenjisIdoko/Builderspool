import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton } from '@/components/skeletons';

export default function AdminMaterialsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-2 h-7 w-56" />
      <Skeleton className="mb-8 h-4 w-72" />
      <KpiRowSkeleton count={4} />
      <TableSkeleton rows={7} cols={5} />
    </div>
  );
}
