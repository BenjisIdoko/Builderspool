import Link from 'next/link';
import { getAllCycles } from '@/lib/queries/adminBidding';
import { getAdminKpis, getRecentOrders, getDailyGmv } from '@/lib/queries/adminStats';
import { formatNaira } from '@/lib/format';
import { cycleStatusTone, orderStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default async function AdminCyclesPage() {
  const [cycles, kpis, recentOrders, dailyGmv] = await Promise.all([
    getAllCycles(),
    getAdminKpis(),
    getRecentOrders(),
    getDailyGmv(),
  ]);

  const kpiCards = [
    { label: 'Platform GMV', value: formatNaira(kpis.platformGmv) },
    { label: 'Builders Pool margin', value: formatNaira(kpis.margin) },
    { label: 'Active demand pools', value: `${kpis.activeDemandPools} open` },
    { label: 'Material volume', value: `${kpis.materialVolume} units` },
    { label: 'Pending hub GRNs', value: `${kpis.pendingGrnCount} arriving` },
  ];

  const maxGmv = Math.max(1, ...dailyGmv.map((d) => d.total));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-3 font-mono text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink">Platform administration</h1>

      <div className="mb-14 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-surface p-5">
            <div className="mb-2.5 text-[11.5px] text-muted-foreground">{kpi.label}</div>
            <div className="font-mono text-xl font-semibold text-ink">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-[13px] font-bold text-slate">Recent orders</h2>
          <div className="grid grid-cols-4 gap-4 border-b border-ink pb-3 text-[12.5px] font-semibold text-slate">
            <div>Order</div>
            <div>Material</div>
            <div>Amount</div>
            <div>Status</div>
          </div>
          {recentOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-4 items-center gap-4 border-b border-border py-3.5 text-[13.5px]">
              <div className="truncate font-mono text-muted-foreground">{order.id}</div>
              <div className="truncate text-ink">
                {order.material}
                {order.extraItemCount > 0 && (
                  <span className="text-muted-foreground"> +{order.extraItemCount}</span>
                )}
              </div>
              <div className="font-mono text-ink">{formatNaira(order.amount)}</div>
              <div>
                <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-4 text-[13px] font-bold text-slate">GMV, last {dailyGmv.length} days</h2>
          <div className="flex h-40 items-end gap-3.5 border-b border-border pb-1">
            {dailyGmv.map((day, i) => {
              const isLast = i === dailyGmv.length - 1;
              const heightPct = Math.max(4, (day.total / maxGmv) * 100);
              return (
                <div key={day.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end">
                  {isLast && (
                    <div className="mb-1.5 font-mono text-[11px] font-semibold text-brand">
                      {formatNaira(day.total)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-sm ${isLast ? 'bg-brand' : 'bg-well'}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3.5">
            {dailyGmv.map((day) => (
              <div key={day.date.toISOString()} className="flex-1 text-center text-[11px] text-muted-foreground">
                {day.date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Bid cycles</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Every demand cycle the bidding engine has created or resolved — one per material, per
        region (national if none), per day.
      </p>

      {cycles.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          No bid cycles yet — one is created the first time a paid order item joins a demand pool
          (see lib/bidding/joinCycle.ts).
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="text-ink">
                    {cycle.material.name}
                    <span className="ml-1.5 text-xs text-muted-foreground">{cycle.material.category}</span>
                  </TableCell>
                  <TableCell className="text-ink">{cycle.region ?? 'National'}</TableCell>
                  <TableCell className="text-ink">
                    {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="font-mono text-ink">
                    {cycle.totalQuantityRequested} {cycle.material.unit}
                  </TableCell>
                  <TableCell className="font-mono text-ink">{cycle.bidCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pillClass(cycleStatusTone(cycle.status))}>
                      {cycle.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/cycles/${cycle.id}`} className="text-sm text-brand hover:underline">
                      View
                    </Link>
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
