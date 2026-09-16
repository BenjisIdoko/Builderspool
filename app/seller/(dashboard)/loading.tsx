import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton, CardGridSkeleton } from '@/components/skeletons';

export default function SellerDashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <Skeleton className="mb-2.5 h-6 w-40 rounded-full" />
      <Skeleton className="mb-1 h-7 w-64" />
      <Skeleton className="mb-7 h-4 w-48" />
      <KpiRowSkeleton count={4} />
      <div className="mb-14 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <TableSkeleton rows={5} cols={4} />
        <div className="rounded-2xl border border-border bg-surface p-4.5">
          <Skeleton className="mb-3 h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-2.5 h-8 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="mb-6 h-6 w-48" />
      <CardGridSkeleton count={3} />
    </div>
  );
}
