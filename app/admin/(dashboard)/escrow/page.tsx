import Link from 'next/link';
import { ClockIcon, CheckCircleIcon, WarningIcon, CurrencyNgnIcon, LockKeyIcon } from '@phosphor-icons/react/ssr';
import { getAllocationsForSettlement } from '@/lib/queries/adminEscrow';
import { formatNaira } from '@/lib/format';
import { payoutStatusTone, pillClass } from '@/lib/statusColors';
import { issueGrnAction, disbursePayoutAction, toggleAllocationHoldAction } from '@/app/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAYOUT_LABEL: Record<string, string> = {
  PENDING_GRN: 'Awaiting GRN',
  PROCESSED: 'Cleared for payout',
  PAID: 'Disbursed',
  ON_HOLD: 'On hold',
};

const QUEUE_FILTERS = [
  { value: 'needs-grn', label: 'Needs GRN' },
  { value: 'ready', label: 'Ready to disburse' },
  { value: 'hold', label: 'On hold' },
  { value: 'paid', label: 'Paid' },
] as const;

export default async function AdminEscrowPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const { queue } = await searchParams;
  const validQueue = QUEUE_FILTERS.some((f) => f.value === queue) ? queue : undefined;

  const allocations = await getAllocationsForSettlement();

  const needsGrn = allocations.filter((a) => !a.receivedAt);
  const readyToDisburse = allocations.filter((a) => a.payoutStatus === 'PROCESSED');
  const onHold = allocations.filter((a) => a.payoutStatus === 'ON_HOLD');
  const paid = allocations.filter((a) => a.payoutStatus === 'PAID');

  const queueMap: Record<string, typeof allocations> = {
    'needs-grn': needsGrn,
    ready: readyToDisburse,
    hold: onHold,
    paid,
  };
  const rows = validQueue ? queueMap[validQueue] : allocations;

  const readyValue = readyToDisburse.reduce(
    (sum, a) => sum + Number(a.bid.unitPrice) * a.quantityFilled,
    0
  );

  const kpiCards = [
    {
      label: 'Needs GRN',
      value: String(needsGrn.length),
      icon: ClockIcon,
      tone: needsGrn.length > 0 ? ('warning' as const) : ('success' as const),
      chip: 'Awaiting hub receipt',
    },
    {
      label: 'Ready to disburse',
      value: String(readyToDisburse.length),
      icon: CurrencyNgnIcon,
      tone: 'info' as const,
      chip: formatNaira(readyValue),
    },
    {
      label: 'On hold',
      value: String(onHold.length),
      icon: WarningIcon,
      tone: onHold.length > 0 ? ('danger' as const) : ('success' as const),
      chip: onHold.length > 0 ? 'Ops exception' : 'None',
    },
    {
      label: 'Disbursed',
      value: String(paid.length),
      icon: CheckCircleIcon,
      tone: 'success' as const,
      chip: 'All-time',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Escrow settlement</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every seller allocation&apos;s real escrow position in one queue, instead of clicking into each
        demand cycle separately. Funds move from locked to released only on a real fulfillment center GRN.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1">
        <Link href="/admin/escrow">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              !validQueue ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
            }`}
          >
            All ({allocations.length})
          </span>
        </Link>
        {QUEUE_FILTERS.map((f) => (
          <Link key={f.value} href={`/admin/escrow?queue=${f.value}`}>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                validQueue === f.value ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
              }`}
            >
              {f.label} ({queueMap[f.value].length})
            </span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <LockKeyIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing in this queue right now.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Escrow amount</TableHead>
                <TableHead>GRN</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell className="py-3 text-ink">
                    <Link
                      href={`/admin/orders/${allocation.orderItem.orderId}`}
                      className="font-semibold hover:underline"
                    >
                      #{allocation.orderItem.orderId.slice(-6).toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    <div className="max-w-40 truncate">
                      {allocation.bid.seller.businessName ?? allocation.bid.seller.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    <div className="max-w-40 truncate">{allocation.bid.material.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {allocation.quantityFilled} {allocation.bid.material.unit}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 font-semibold text-ink">
                    {formatNaira(Number(allocation.bid.unitPrice) * allocation.quantityFilled)}
                  </TableCell>
                  <TableCell className="py-3">
                    {allocation.grnNumber ? (
                      <div className="text-xs text-ink">{allocation.grnNumber}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={pillClass(payoutStatusTone(allocation.payoutStatus))}>
                      {PAYOUT_LABEL[allocation.payoutStatus]}
                    </Badge>
                    {allocation.payoutStatus === 'ON_HOLD' && allocation.holdReason && (
                      <div className="mt-1 text-xs text-danger">{allocation.holdReason}</div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {allocation.status !== 'CANCELLED' && !allocation.receivedAt && (
                        <form action={issueGrnAction}>
                          <input type="hidden" name="allocationId" value={allocation.id} />
                          <input type="hidden" name="cycleId" value={allocation.bid.cycleId} />
                          <Button type="submit" variant="outline" size="sm">
                            Issue GRN
                          </Button>
                        </form>
                      )}
                      {allocation.payoutStatus === 'PROCESSED' && (
                        <form action={disbursePayoutAction}>
                          <input type="hidden" name="allocationId" value={allocation.id} />
                          <input type="hidden" name="cycleId" value={allocation.bid.cycleId} />
                          <Button type="submit" size="sm">
                            Disburse
                          </Button>
                        </form>
                      )}
                      {allocation.payoutStatus !== 'PAID' && (
                        <form action={toggleAllocationHoldAction}>
                          <input type="hidden" name="allocationId" value={allocation.id} />
                          <input type="hidden" name="cycleId" value={allocation.bid.cycleId} />
                          <Button type="submit" variant="ghost" size="sm">
                            {allocation.payoutStatus === 'ON_HOLD' ? 'Release hold' : 'Put on hold'}
                          </Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
