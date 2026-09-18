import Link from 'next/link';
import {
  ChartBarIcon,
  ChartPieSliceIcon,
  ClipboardTextIcon,
  ClockIcon,
  CurrencyNgnIcon,
  GavelIcon,
  PackageIcon,
  ReceiptIcon,
  StorefrontIcon,
  TagIcon,
  TrendUpIcon,
} from '@phosphor-icons/react/ssr';
import { getAllCycles } from '@/lib/queries/adminBidding';
import { getAdminKpis, getRecentOrders, getDailyGmv, getTopSellersByRevenue } from '@/lib/queries/adminStats';
import { getSellersForVerification } from '@/lib/queries/adminVerification';
import { getMaterialsNeedingPriceReviewCount } from '@/lib/queries/adminMaterials';
import { getDemoAdmin } from '@/lib/demoAdmin';
import { formatNaira } from '@/lib/format';
import { orderStatusTone, cycleStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/avatar';
import { KpiCard } from '@/components/kpi-card';
import { CyclesTable } from '@/components/admin/cycles-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

function shortOrderNumber(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

const CYCLE_STATUS_CHART_TONE = {
  OPEN: 'success',
  CLOSED: 'warning',
  AWARDED: 'info',
} as const;

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function AdminDashboardPage() {
  const [cycles, kpis, recentOrders, dailyGmv, topSellers, verificationSellers, priceReviewCount, admin] =
    await Promise.all([
      getAllCycles(),
      getAdminKpis(),
      getRecentOrders(),
      getDailyGmv(),
      getTopSellersByRevenue(),
      getSellersForVerification(),
      getMaterialsNeedingPriceReviewCount(),
      getDemoAdmin(),
    ]);

  const pendingVerificationCount = verificationSellers.filter((s) => s.sellerProfile?.kycStatus === 'PENDING').length;

  // Real alerts only — both counts come straight from the same data the
  // Verification and Materials pages already show, not a fabricated
  // "disputes"/"compliance" feed with no backing model.
  const attentionItems = [
    pendingVerificationCount > 0 && {
      title: `${pendingVerificationCount} seller${pendingVerificationCount === 1 ? '' : 's'} pending verification`,
      detail: 'CAC docs submitted, awaiting review',
      icon: StorefrontIcon,
      href: '/admin/verification',
    },
    priceReviewCount > 0 && {
      title: `${priceReviewCount} material${priceReviewCount === 1 ? '' : 's'} need price review`,
      detail: 'Imported with a placeholder price',
      icon: TagIcon,
      href: '/admin/materials?review=1',
    },
    kpis.pendingGrnCount > 0 && {
      title: `${kpis.pendingGrnCount} allocation${kpis.pendingGrnCount === 1 ? '' : 's'} awaiting hub GRN`,
      detail: 'Fulfillment center receipt not yet logged',
      icon: ClipboardTextIcon,
      href: '/admin/escrow',
    },
  ].filter(Boolean) as { title: string; detail: string; icon: typeof StorefrontIcon; href: string }[];

  // Every chip below is a real, honestly-derived read — no fabricated
  // percentages or comparisons the data doesn't support.
  const marginPct = kpis.platformGmv > 0 ? (kpis.margin / kpis.platformGmv) * 100 : 0;
  const kpiCards = [
    {
      label: 'Platform GMV',
      value: formatNaira(kpis.platformGmv),
      icon: CurrencyNgnIcon,
      tone: 'info' as const,
      chip: 'All-time',
    },
    {
      label: 'Builders Pool margin',
      value: formatNaira(kpis.margin),
      icon: TrendUpIcon,
      tone: 'success' as const,
      chip: `${marginPct.toFixed(1)}% of GMV`,
    },
    {
      label: 'Active demand pools',
      value: `${kpis.activeDemandPools} open`,
      icon: ClockIcon,
      tone: 'info' as const,
      chip: 'Live count',
    },
    {
      label: 'Material volume',
      value: `${kpis.materialVolume} units`,
      icon: PackageIcon,
      tone: 'info' as const,
      chip: 'All-time',
    },
    {
      label: 'Pending hub GRNs',
      value: `${kpis.pendingGrnCount} arriving`,
      icon: ClipboardTextIcon,
      tone: kpis.pendingGrnCount > 0 ? ('warning' as const) : ('success' as const),
      chip: kpis.pendingGrnCount > 0 ? 'Needs receipt' : 'All clear',
    },
  ];

  const maxGmv = Math.max(1, ...dailyGmv.map((d) => d.total));

  const openCycles = cycles
    .filter((c) => c.status === 'OPEN')
    .sort((a, b) => a.cutoffAt.getTime() - b.cutoffAt.getTime());

  const cycleStatusCounts = (['OPEN', 'CLOSED', 'AWARDED'] as const).map((status) => ({
    status,
    count: cycles.filter((c) => c.status === status).length,
  }));
  const maxCycleStatusCount = Math.max(1, ...cycleStatusCounts.map((c) => c.count));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-3 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">
        {greeting((new Date().getUTCHours() + 1) % 24)}, {admin.name.split(' ')[0]}
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Marketplace health across escrow, fulfillment, and merchant activity.
      </p>

      <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-[13px] font-bold text-slate">Needs attention</h2>
          {attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {attentionItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-well"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning">
                    <item.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-ink">{item.title}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">{item.detail}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-[13px] font-bold text-slate">Top merchants (MTD)</h2>
          {topSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No allocations this month yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {topSellers.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-ink">{s.name}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">{s.category}</div>
                  </div>
                  <div className="shrink-0 text-[13px] font-extrabold tabular-nums text-ink">
                    {formatNaira(s.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-1 flex items-center gap-2">
            <ChartBarIcon className="size-4.5 text-slate" />
            <h2 className="text-[13px] font-bold text-slate">GMV, last {dailyGmv.length} days</h2>
          </div>
          <p className="mb-5 text-xs text-muted-foreground">Real paid-order totals per calendar day.</p>
          <div className="flex h-40 items-end gap-3.5 border-b border-border pb-1">
            {dailyGmv.map((day, i) => {
              const isLast = i === dailyGmv.length - 1;
              const heightPct = Math.max(4, (day.total / maxGmv) * 100);
              return (
                <div key={day.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end">
                  {isLast && (
                    <div className="mb-1.5 text-[11px] font-semibold text-brand">
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

        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-1 flex items-center gap-2">
            <ChartPieSliceIcon className="size-4.5 text-slate" />
            <h2 className="text-[13px] font-bold text-slate">Bid cycles by status</h2>
          </div>
          <p className="mb-5 text-xs text-muted-foreground">Every cycle ever created, {cycles.length} total.</p>
          <div className="flex flex-col gap-4">
            {cycleStatusCounts.map(({ status, count }) => (
              <div key={status}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <Badge variant="outline" className={pillClass(cycleStatusTone(status))}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Badge>
                  <span className="font-semibold text-ink">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-well">
                  <div
                    className={`h-full rounded-full ${
                      CYCLE_STATUS_CHART_TONE[status] === 'success'
                        ? 'bg-success'
                        : CYCLE_STATUS_CHART_TONE[status] === 'warning'
                          ? 'bg-warning'
                          : 'bg-info'
                    }`}
                    style={{ width: `${(count / maxCycleStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-14">
        <div className="mb-4 flex items-center gap-2">
          <GavelIcon className="size-4.5 text-slate" />
          <h2 className="text-xl font-bold tracking-tight text-ink">Open bids</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Demand pools still accepting seller bids, soonest cutoff first — {openCycles.length} open right now.
        </p>
        {openCycles.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
            No cycles are currently open for bidding.
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
                  <TableHead>Bids so far</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {openCycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="py-3 text-ink">
                      {cycle.material.name}
                      <span className="ml-1.5 text-xs text-muted-foreground">{cycle.material.category}</span>
                    </TableCell>
                    <TableCell className="py-3 text-ink">{cycle.region ?? 'National'}</TableCell>
                    <TableCell className="py-3 text-ink">
                      {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="py-3 text-ink">
                      {cycle.totalQuantityRequested} {cycle.material.unit}
                    </TableCell>
                    <TableCell className="py-3 text-ink">{cycle.bidCount}</TableCell>
                    <TableCell className="py-3 text-right">
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

      <div className="mb-14">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="size-4.5 text-slate" />
            <h2 className="text-xl font-bold tracking-tight text-ink">Recent orders</h2>
          </div>
          <Link href="/admin/orders" className="text-sm text-brand hover:underline">
            View all orders →
          </Link>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          The latest checkouts across every buyer — full filtering and search live on the Orders page.
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="py-3 font-semibold text-ink" title={order.id}>
                    {shortOrderNumber(order.id)}
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={order.buyer.name} className="size-7 shrink-0 text-[10px]" />
                      <div className="max-w-36 truncate">{order.buyer.businessName ?? order.buyer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    {order.material}
                    {order.extraItemCount > 0 && (
                      <span className="text-muted-foreground"> +{order.extraItemCount}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 font-semibold text-ink">{formatNaira(order.amount)}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CyclesTable cycles={cycles} />
    </div>
  );
}
