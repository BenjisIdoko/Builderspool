import { Skeleton } from '@/components/ui/skeleton';
import { FormSkeleton } from '@/components/skeletons';

export default function CheckoutLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Skeleton className="mb-8 h-7 w-40" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <FormSkeleton fields={3} />
        <div className="rounded-2xl border border-border bg-surface p-6">
          <Skeleton className="mb-4 h-5 w-36" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-6 h-4 w-2/3" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
