import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons';

export default function AdminCycleDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-8 h-4 w-48" />
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
