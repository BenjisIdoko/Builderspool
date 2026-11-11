import { Skeleton } from '@/components/ui/skeleton';

export default function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-section py-10">
      <Skeleton className="mb-8 h-7 w-40" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="divide-y divide-border rounded-lg bg-surface">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="size-16 shrink-0 rounded-md" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="h-fit rounded-lg bg-surface p-5">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-6 h-4 w-2/3" />
          <Skeleton className="h-13 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
