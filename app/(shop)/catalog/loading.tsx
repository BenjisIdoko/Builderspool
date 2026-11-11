import { Skeleton } from '@/components/ui/skeleton';
import { CardGridSkeleton } from '@/components/skeletons';

export default function CatalogLoading() {
  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-10">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-2 h-7 w-72" />
      <Skeleton className="mb-8 h-4 w-56" />
      <div className="mb-6 flex gap-2 overflow-hidden lg:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <CardGridSkeleton count={9} />
    </div>
  );
}
