import { Skeleton } from '@/components/ui/skeleton';
import { TimelineSkeleton } from '@/components/skeletons';

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Skeleton className="mx-auto mb-4 size-12 rounded-full" />
      <Skeleton className="mx-auto mb-2 h-6 w-48" />
      <Skeleton className="mx-auto mb-8 h-4 w-64" />
      <TimelineSkeleton steps={5} />
    </div>
  );
}
