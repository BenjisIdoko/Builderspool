import { Skeleton } from '@/components/ui/skeleton';
import { FormSkeleton } from '@/components/skeletons';

export default function SellerKycLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-8 h-4 w-72" />
      <FormSkeleton fields={5} />
    </div>
  );
}
