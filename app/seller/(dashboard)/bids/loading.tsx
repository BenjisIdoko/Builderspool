import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons';

export default function SellerBidsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-5xl">
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-8 h-4 w-64" />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
