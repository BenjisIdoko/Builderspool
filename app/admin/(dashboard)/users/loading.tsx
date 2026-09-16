import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/skeletons';

export default function AdminUsersLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-2 h-7 w-32" />
      <Skeleton className="mb-8 h-4 w-72" />
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <Skeleton className="mb-1 h-3 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={7} cols={7} />
    </div>
  );
}
