import { Skeleton } from '@/components/ui/skeleton';
import { FormSkeleton, TableSkeleton } from '@/components/skeletons';

export default function AccountLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Skeleton className="mb-1 h-6 w-56" />
      <Skeleton className="mb-8 h-4 w-32" />
      <div className="mb-8">
        <FormSkeleton fields={4} />
      </div>
      <Skeleton className="mb-3 h-5 w-32" />
      <TableSkeleton rows={4} cols={3} />
    </div>
  );
}
