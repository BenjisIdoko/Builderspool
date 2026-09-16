import { Skeleton } from '@/components/ui/skeleton';
import { FormSkeleton } from '@/components/skeletons';

export default function AdminMaterialDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-8 h-4 w-48" />
      <FormSkeleton fields={5} />
    </div>
  );
}
