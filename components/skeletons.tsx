import { Skeleton } from '@/components/ui/skeleton';

// Shared loading-state building blocks, composed per-route in each
// segment's loading.tsx. Shapes approximate the real page layout (KPI
// cards, tables, product grids, two-column details) closely enough to
// avoid a layout jump when real content lands, without needing to be
// pixel-exact — these are shown for a moment during data fetch, not
// permanent UI.

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="mb-2 h-3 w-32" />
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-5">
          <Skeleton className="mb-4 size-9 rounded-lg" />
          <Skeleton className="mb-1.5 h-3 w-20" />
          <Skeleton className="mb-2.5 h-6 w-16" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5">
        <div className="flex gap-8">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-8 px-4 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[14px] border border-border bg-surface">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="mb-1.5 h-4 w-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-8 h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <Skeleton className="mb-4 h-6 w-1/2" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-6 h-4 w-2/3" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="max-w-xl rounded-lg border border-border bg-surface p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="mb-5 last:mb-0">
          <Skeleton className="mb-1.5 h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="mt-2 h-10 w-32" />
    </div>
  );
}

export function TimelineSkeleton({ steps = 4 }: { steps?: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 pb-6 last:pb-0">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="w-full">
            <Skeleton className="mb-1.5 h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
