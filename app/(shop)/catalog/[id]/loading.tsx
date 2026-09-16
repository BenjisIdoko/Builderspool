import { Skeleton } from '@/components/ui/skeleton';
import { DetailSkeleton } from '@/components/skeletons';

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="mb-6 h-4 w-56" />
      <DetailSkeleton />
    </div>
  );
}
