import { Skeleton } from '@/components/ui/skeleton';
import { FormSkeleton } from '@/components/skeletons';

export default function AdminMaterialDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-3xl">
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-8 h-4 w-48" />
      <FormSkeleton fields={5} />
    </div>
  );
}
