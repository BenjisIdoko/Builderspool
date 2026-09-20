import { Skeleton } from '@/components/ui/skeleton';
import { CardGridSkeleton } from '@/components/skeletons';

export default function HomeLoading() {
  return (
    <div>
      <section className="mx-auto w-full max-w-section px-6 pt-10 sm:pt-14">
        <Skeleton className="h-72 w-full rounded-3xl sm:h-96" />
      </section>
      <section className="mx-auto w-full max-w-section px-6 py-14">
        <Skeleton className="mb-6 h-6 w-56" />
        <CardGridSkeleton count={8} />
      </section>
    </div>
  );
}
