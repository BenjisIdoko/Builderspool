import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-12">
      <Skeleton className="mb-2 h-9 w-64" />
      <Skeleton className="mb-8 h-4 w-28" />
      <div className="flex flex-col gap-8">
        <div className="divide-y divide-border overflow-hidden rounded-card bg-surface">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-52 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    </div>
  );
}
