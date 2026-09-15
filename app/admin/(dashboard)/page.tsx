import {
  ChartBarIcon,
  ClipboardTextIcon,
  ClockIcon,
  CurrencyNgnIcon,
  PackageIcon,
  ReceiptIcon,
  TrendUpIcon,
} from '@phosphor-icons/react/ssr';
import { getAllCycles } from '@/lib/queries/adminBidding';
import { getAdminKpis, getRecentOrders, getDailyGmv } from '@/lib/queries/adminStats';
import { formatNaira } from '@/lib/format';
import { orderStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { CyclesTable } from '@/components/admin/cycles-table';

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

  // Every chip below is a real, honestly-derived read — no fabricated
  // percentages or comparisons the data doesn't support.
  const marginPct = kpis.platformGmv > 0 ? (kpis.margin / kpis.platformGmv) * 100 : 0;
  const kpiCards = [
    {
      label: 'Platform GMV',
      value: formatNaira(kpis.platformGmv),
      icon: CurrencyNgnIcon,
      chip: { text: 'All-time', tone: 'info' as const },
    },
    {
      label: 'Builders Pool margin',
      value: formatNaira(kpis.margin),
      icon: TrendUpIcon,
      chip: { text: `${marginPct.toFixed(1)}% of GMV`, tone: 'success' as const },
    },
    {
      label: 'Active demand pools',
      value: `${kpis.activeDemandPools} open`,
      icon: ClockIcon,
      chip: { text: 'Live count', tone: 'info' as const },
    },
    {
      label: 'Material volume',
      value: `${kpis.materialVolume} units`,
      icon: PackageIcon,
      chip: { text: 'All-time', tone: 'info' as const },
    },
    {
      label: 'Pending hub GRNs',
      value: `${kpis.pendingGrnCount} arriving`,
      icon: ClipboardTextIcon,
      chip:
        kpis.pendingGrnCount > 0
          ? { text: 'Needs receipt', tone: 'warning' as const }
          : { text: 'All clear', tone: 'success' as const },
    },
  ];

  const maxGmv = Math.max(1, ...dailyGmv.map((d) => d.total));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-3 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink">Platform administration</h1>

      <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-surface p-5">
            <div className={`mb-4 flex size-9 items-center justify-center rounded-lg ${pillClass(kpi.chip.tone)}`}>
              <kpi.icon className="size-4.5" />
            </div>
            <div className="mb-1.5 text-[11.5px] text-muted-foreground">{kpi.label}</div>
            <div className="mb-2.5 text-xl font-semibold text-ink">{kpi.value}</div>
            <Badge variant="outline" className={pillClass(kpi.chip.tone)}>
              {kpi.chip.text}
            </Badge>
          </div>
        ))}
      </div>

      <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-1 flex items-center gap-2">
            <ReceiptIcon className="size-4.5 text-slate" />
            <h2 className="text-[13px] font-bold text-slate">Recent orders</h2>
          </div>
          <p className="mb-5 text-xs text-muted-foreground">The latest checkouts across every buyer, newest first.</p>
          <div className="grid grid-cols-4 gap-4 border-b border-ink pb-3 text-[12.5px] font-semibold text-slate">
            <div>Order</div>
            <div>Material</div>
            <div>Amount</div>
            <div>Status</div>
          </div>
          {recentOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-4 items-center gap-4 border-b border-border py-3.5 text-[13.5px]">
              <div className="truncate text-muted-foreground">{order.id}</div>
              <div className="truncate text-ink">
                {order.material}
                {order.extraItemCount > 0 && (
                  <span className="text-muted-foreground"> +{order.extraItemCount}</span>
                )}
              </div>
              <div className="text-ink">{formatNaira(order.amount)}</div>
              <div>
                <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

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
      </div>

      <CyclesTable cycles={cycles} />
    </div>
  );
}
