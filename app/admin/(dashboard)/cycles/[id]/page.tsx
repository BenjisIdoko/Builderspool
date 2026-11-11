import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { getCycleDetail } from '@/lib/queries/adminBidding';
import { Money } from '@/components/money';
import { getSetting } from '@/lib/settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { forceAwardCycle, freezeCycleNowAction, issueGrnAction, disbursePayoutAction, toggleAllocationHoldAction } from '@/app/admin/actions';
import { allocationStatusTone, bidStatusTone, cycleStatusTone, payoutStatusTone, pillClass } from '@/lib/statusColors';
import { formatLagosClock, formatLagosDateTime } from '@/lib/format';

const REJECTION_LABEL: Record<string, string> = {
  NOT_APPROVED: 'Seller not approved',
  OUTSIDE_SERVICE_AREA: "Doesn't serve this region",
  INVALID_BID: 'Invalid price, quantity or delivery',
  OVER_WINNER_CAP: 'Winner cap reached for this category and zone',
  BELOW_MIN_BIDS: 'Too few eligible bids to award',
  AWARD_DECLINED: 'Seller declined the award',
  AWARD_EXPIRED: 'Seller did not accept in time',
  SELLER_SUSPENDED: 'Seller suspended before accepting',
};

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  PENDING_GRN: 'Pending GRN',
  PROCESSED: 'Cleared',
  PAID: 'Paid',
  ON_HOLD: 'On hold',
};

export default async function AdminCycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payoutsEnabled = await getSetting<boolean>('money.sellerPayoutsEnabled');
  const cycle = await getCycleDetail(id);
  if (!cycle) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <Link href="/admin" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <CaretLeftIcon className="size-4" />
        All cycles
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-lg bg-card-alt p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-lg text-ink">{cycle.material.name}</h1>
            <Badge variant="outline" className={pillClass(cycleStatusTone(cycle.status))}>
              {cycle.status.toLowerCase()}
            </Badge>
            {cycle.needsAttention && (
              <Badge variant="outline" className="bg-transparent text-danger border-danger/30">
                needs attention
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {cycle.region ?? 'National'} · bids close{' '}
            {formatLagosDateTime(cycle.bidsCloseAt ?? cycle.cutoffAt)}
            {cycle.poolClosesAt &&
              ` · pool closes ${formatLagosClock(cycle.poolClosesAt)}`}{' '}
            (Lagos time)
          </p>
          <p className="mt-2 text-sm text-ink">
            Demand: <span className="font-bold">{cycle.totalQuantityRequested}</span> {cycle.material.unit}{' '}
            requested · <span className="font-bold">{cycle.totalQuantityAllocated}</span> allocated
          </p>
        </div>

        {(cycle.status === 'OPEN' || cycle.status === 'BIDDING') && (
          <div className="flex flex-wrap gap-2">
            {cycle.status === 'OPEN' && (
              <form action={freezeCycleNowAction}>
                <input type="hidden" name="cycleId" value={cycle.id} />
                <Button type="submit" variant="outline">
                  Freeze pool &amp; open bidding now
                </Button>
              </form>
            )}
            <form action={forceAwardCycle}>
              <input type="hidden" name="cycleId" value={cycle.id} />
              <Button type="submit" variant="outline">
                Close &amp; award now
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="mb-8 overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-heading-sm text-ink">Bids ({cycle.bids.length})</h2>
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
                <TableHead>Score (0–100)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycle.bids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell className="text-ink">{bid.rank ?? '—'}</TableCell>
                  <TableCell className="text-ink">{bid.sellerName}</TableCell>
                  <TableCell className="font-mono font-medium tabular-nums text-ink"><Money amount={bid.unitPrice} /></TableCell>
                  <TableCell className="text-ink">
                    {bid.quantityOffered} {cycle.material.unit}
                  </TableCell>
                  <TableCell className="text-ink">{bid.estimatedDeliveryDays}d</TableCell>
                  <TableCell className="text-ink">{bid.score ? bid.score.toFixed(1) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pillClass(bidStatusTone(bid.status))}>
                      {bid.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                    {bid.rejectionReason && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {REJECTION_LABEL[bid.rejectionReason] ?? bid.rejectionReason}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-card-alt">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-heading-sm text-ink">Allocations</h2>
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
                <TableHead>GRN</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Actions</TableHead>
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
                    <TableCell>
                      <Badge variant="outline" className={pillClass(allocationStatusTone(allocation.status))}>
                        {allocation.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {allocation.grnNumber ? (
                        <>
                          <div className="text-xs text-ink">{allocation.grnNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {allocation.receivedAt!.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={pillClass(payoutStatusTone(allocation.payoutStatus))}>
                        {PAYOUT_STATUS_LABEL[allocation.payoutStatus]}
                      </Badge>
                      {allocation.payoutStatus === 'PAID' && allocation.payoutReference && (
                        <div className="mt-1 text-xs text-muted-foreground">{allocation.payoutReference}</div>
                      )}
                      {allocation.payoutStatus === 'ON_HOLD' && allocation.holdReason && (
                        <div className="mt-1 text-xs text-danger">{allocation.holdReason}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {allocation.status !== 'CANCELLED' && !allocation.receivedAt && (
                          <form action={issueGrnAction}>
                            <input type="hidden" name="allocationId" value={allocation.id} />
                            <input type="hidden" name="cycleId" value={cycle.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Issue GRN
                            </Button>
                          </form>
                        )}
                        {allocation.payoutStatus === 'PROCESSED' && payoutsEnabled && (
                          <form action={disbursePayoutAction}>
                            <input type="hidden" name="allocationId" value={allocation.id} />
                            <input type="hidden" name="cycleId" value={cycle.id} />
                            <Button type="submit" size="sm">
                              Disburse
                            </Button>
                          </form>
                        )}
                        {allocation.payoutStatus !== 'PAID' && (
                          <form action={toggleAllocationHoldAction}>
                            <input type="hidden" name="allocationId" value={allocation.id} />
                            <input type="hidden" name="cycleId" value={cycle.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {allocation.payoutStatus === 'ON_HOLD' ? 'Release hold' : 'Put on hold'}
                            </Button>
                          </form>
                        )}
                      </div>
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
