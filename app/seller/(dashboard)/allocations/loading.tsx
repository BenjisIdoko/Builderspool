import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons';

export default function SellerAllocationsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-8 h-4 w-64" />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
