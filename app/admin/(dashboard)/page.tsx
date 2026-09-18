import Link from 'next/link';
import {
  ChartPieSliceIcon,
  ClipboardTextIcon,
  GavelIcon,
  LockKeyIcon,
  StorefrontIcon,
  TagIcon,
  TrendUpIcon,
} from '@phosphor-icons/react/ssr';
import { getAllCycles } from '@/lib/queries/adminBidding';
import {
  getAdminKpis,
  getRecentOrders,
  getWeeklyGmv,
  getTopSellersByRevenue,
  getGmvMonthToDate,
  getEscrowInCustody,
} from '@/lib/queries/adminStats';
import { getSellersForVerification } from '@/lib/queries/adminVerification';
import { getMaterialsNeedingPriceReviewCount } from '@/lib/queries/adminMaterials';
import { getVerifiedSellerCount } from '@/lib/queries/adminSellers';
import { getDemoAdmin } from '@/lib/demoAdmin';
import { formatNaira } from '@/lib/format';
import { orderStatusTone, cycleStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
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
  const [
    cycles,
    kpis,
    recentOrders,
    weeklyGmv,
    topSellers,
    verificationSellers,
    priceReviewCount,
    admin,
    gmvMtd,
    escrowInCustody,
    verifiedSellerCount,
  ] = await Promise.all([
    getAllCycles(),
    getAdminKpis(),
    getRecentOrders(5),
    getWeeklyGmv(),
    getTopSellersByRevenue(),
    getSellersForVerification(),
    getMaterialsNeedingPriceReviewCount(),
    getDemoAdmin(),
    getGmvMonthToDate(),
    getEscrowInCustody(),
    getVerifiedSellerCount(),
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

  // Four cards, matching the design's KPI row exactly: GMV (MTD), escrow in
  // custody, and verified sellers are all real, freshly-added aggregates
  // (see lib/queries/adminStats.ts / adminSellers.ts). The design's fourth
  // card is "Disputes open" — no Dispute model exists anywhere in the
  // schema, so it's replaced with the same real "pending hub GRNs" figure
  // the Needs Attention panel already surfaces, keeping the same
  // warning-toned "something needs a look" shape as the original slot.
  const kpiCards = [
    {
      label: 'GMV (month to date)',
      value: formatNaira(gmvMtd),
      icon: TrendUpIcon,
      tone: 'success' as const,
      chip: 'This calendar month',
    },
    {
      label: 'Escrow in custody',
      value: formatNaira(escrowInCustody),
      icon: LockKeyIcon,
      tone: 'info' as const,
      chip: 'Held, not yet paid out',
    },
    {
      label: 'Pending hub GRNs',
      value: `${kpis.pendingGrnCount}`,
      icon: ClipboardTextIcon,
      tone: kpis.pendingGrnCount > 0 ? ('warning' as const) : ('success' as const),
      chip: kpis.pendingGrnCount > 0 ? 'Needs receipt' : 'All clear',
    },
    {
      label: 'Verified sellers',
      value: `${verifiedSellerCount}`,
      icon: StorefrontIcon,
      tone: 'neutral' as const,
      chip: `${pendingVerificationCount} pending verification`,
    },
  ];

  const maxWeeklyGmv = Math.max(1, ...weeklyGmv.map((w) => w.total));

  const openCycles = cycles
    .filter((c) => c.status === 'OPEN')
    .sort((a, b) => a.cutoffAt.getTime() - b.cutoffAt.getTime());

  const cycleStatusCounts = (['OPEN', 'CLOSED', 'AWARDED'] as const).map((status) => ({
    status,
    count: cycles.filter((c) => c.status === status).length,
  }));
  const maxCycleStatusCount = Math.max(1, ...cycleStatusCounts.map((c) => c.count));

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · platform overview</div>
      <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-ink">
        {greeting((new Date().getUTCHours() + 1) % 24)}, {admin.name.split(' ')[0]}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Marketplace health across escrow, fulfillment, and merchant activity — last updated just now.
      </p>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <div className="mb-14 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3.5 text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
              GMV trend (last {weeklyGmv.length} weeks)
            </h2>
            <div className="flex h-36 items-end gap-2.5">
              {weeklyGmv.map((week, i) => {
                const isLast = i === weeklyGmv.length - 1;
                const heightPct = Math.max(4, (week.total / maxWeeklyGmv) * 100);
                return (
                  <div key={week.weekStart.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <div
                      className={`w-full rounded-t-md ${isLast ? 'bg-brand' : 'bg-well'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="text-[10.5px] text-muted-foreground">W{i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
                Latest requisitions
              </h2>
              <Link href="/admin/orders" className="text-[13px] font-bold text-brand hover:underline">
                View all →
              </Link>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="py-3 font-semibold text-ink" title={order.id}>
                      {shortOrderNumber(order.id)}
                    </TableCell>
                    <TableCell className="py-3 text-slate">{order.buyer.businessName ?? order.buyer.name}</TableCell>
                    <TableCell className="py-3 text-right font-semibold tabular-nums text-ink">
                      {formatNaira(order.amount)}
                    </TableCell>
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

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface p-[18px]">
            <h2 className="mb-3.5 text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
              Needs attention
            </h2>
            {attentionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {attentionItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-well"
                  >
                    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning">
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

          <div className="rounded-2xl border border-border bg-surface p-[18px]">
            <h2 className="mb-3.5 text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
              Top merchants (MTD)
            </h2>
            {topSellers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No allocations this month yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
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
      </div>

      <div className="mb-4 border-t border-border pt-10">
        <h2 className="text-sm font-bold text-slate">More detail</h2>
        <p className="text-xs text-muted-foreground">
          Platform-specific views with no equivalent in the top summary above.
        </p>
      </div>

      <div className="mb-14">
        <div className="mb-1 flex items-center gap-2">
          <ChartPieSliceIcon className="size-4.5 text-slate" />
          <h2 className="text-[13px] font-bold text-slate">Bid cycles by status</h2>
        </div>
        <p className="mb-5 text-xs text-muted-foreground">Every cycle ever created, {cycles.length} total.</p>
        <div className="max-w-md rounded-lg border border-border bg-surface p-6">
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

      <CyclesTable cycles={cycles} />
    </div>
  );
}
