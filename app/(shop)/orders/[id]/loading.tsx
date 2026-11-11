import { Skeleton } from '@/components/ui/skeleton';
import { TimelineSkeleton } from '@/components/skeletons';

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-12">
      <div className="mb-8 flex items-start gap-4 rounded-lg bg-surface p-6">
        <Skeleton className="size-10 shrink-0 rounded-md" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <TimelineSkeleton steps={5} />
    </div>
  );
}
