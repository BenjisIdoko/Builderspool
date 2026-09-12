import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { getCycleDetail } from '@/lib/queries/adminBidding';
import { formatNaira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { forceAwardCycle } from '@/app/admin/actions';

const CYCLE_STATUS_CLASS: Record<string, string> = {
  OPEN: 'bg-transparent text-slate border-border',
  CLOSED: 'bg-transparent text-warning border-warning/30',
  AWARDED: 'bg-brand text-brand-ink',
};

const BID_STATUS_CLASS: Record<string, string> = {
  SUBMITTED: 'bg-transparent text-slate border-border',
  PARTIALLY_FILLED: 'bg-transparent text-brand border-brand/30',
  FILLED: 'bg-brand text-brand-ink',
  REJECTED: 'bg-transparent text-muted-foreground border-border',
  WITHDRAWN: 'bg-transparent text-muted-foreground border-border',
};

export default async function AdminCycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await getCycleDetail(id);
  if (!cycle) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link href="/admin" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <CaretLeftIcon className="size-4" />
        All cycles
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">{cycle.material.name}</h1>
            <Badge variant="outline" className={CYCLE_STATUS_CLASS[cycle.status]}>
              {cycle.status.toLowerCase()}
            </Badge>
            {cycle.needsAttention && (
              <Badge variant="outline" className="bg-transparent text-danger border-danger/30">
                needs attention
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {cycle.region ?? 'National'} · cutoff{' '}
            {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          <p className="mt-2 text-sm text-ink">
            Demand: <span className="font-bold">{cycle.totalQuantityRequested}</span> {cycle.material.unit}{' '}
            requested · <span className="font-bold">{cycle.totalQuantityAllocated}</span> allocated
          </p>
        </div>

        {cycle.status === 'OPEN' && (
          <form action={forceAwardCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <Button type="submit" variant="outline">
              Close &amp; award now
            </Button>
          </form>
        )}
      </div>

      <div className="mb-8 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-bold text-slate">Bids ({cycle.bids.length})</h2>
        </div>
        {cycle.bids.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No bids submitted yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Qty offered</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycle.bids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell className="text-ink">{bid.rank ?? '—'}</TableCell>
                  <TableCell className="text-ink">{bid.sellerName}</TableCell>
                  <TableCell className="font-bold text-ink">{formatNaira(bid.unitPrice)}</TableCell>
                  <TableCell className="text-ink">
                    {bid.quantityOffered} {cycle.material.unit}
                  </TableCell>
                  <TableCell className="text-ink">{bid.estimatedDeliveryDays}d</TableCell>
                  <TableCell className="text-ink">{bid.score ? bid.score.toFixed(3) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={BID_STATUS_CLASS[bid.status]}>
                      {bid.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-bold text-slate">Allocations</h2>
        </div>
        {cycle.bids.every((bid) => bid.allocations.length === 0) ? (
          <p className="p-5 text-sm text-muted-foreground">
            {cycle.status === 'OPEN' ? 'Not awarded yet.' : 'No allocations were created.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Quantity filled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycle.bids.flatMap((bid) =>
                bid.allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="text-ink">{bid.sellerName}</TableCell>
                    <TableCell className="text-ink">
                      {allocation.quantityFilled} {cycle.material.unit}
                    </TableCell>
                    <TableCell className="text-ink">{allocation.status.toLowerCase()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {allocation.receivedAt
                        ? allocation.receivedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
