import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons';

export default function SellerOrdersLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <Skeleton className="mb-1 h-3 w-28" />
      <Skeleton className="mb-2 h-6 w-56" />
      <Skeleton className="mb-6 h-4 w-96 max-w-full" />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
