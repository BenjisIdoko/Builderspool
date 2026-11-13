import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton, TableSkeleton } from '@/components/skeletons';

// The loading shape shared by admin pages: the page wrapper, a title block, optional KPI cards, then a
// table or a stack of cards. Each page's loading.tsx picks the parts it has.
export function AdminPageSkeleton({ kpis = 0, body = 'table', rows = 6 }: { kpis?: number; body?: 'table' | 'cards'; rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <Skeleton className="mb-1 h-3 w-44" />
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-6 h-4 w-full max-w-2xl" />
      {kpis > 0 && <KpiRowSkeleton count={kpis} />}
      {body === 'table' ? (
        <TableSkeleton rows={rows} cols={5} />
      ) : (
        <div className="space-y-4">
          {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      )}
    </div>
  );
}
