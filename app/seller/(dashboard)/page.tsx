import {
  AlarmIcon,
  ClockIcon,
  StackIcon,
  TrophyIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile, getOpenCyclesForSeller, getSellerBids, getSellerAllocations } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { pillClass } from '@/lib/statusColors';
import { BidDialog } from '@/components/seller/bid-dialog';
import { Badge } from '@/components/ui/badge';

export default async function SellerDashboardPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const [profile, cycles, bids, allocations] = await Promise.all([
    getSellerProfile(sellerId),
    getOpenCyclesForSeller(sellerId),
    getSellerBids(sellerId),
    getSellerAllocations(sellerId),
  ]);

  const today = new Date();
  const closingToday = cycles.filter((c) => {
    const cutoff = c.cutoffAt;
    return (
      cutoff.getFullYear() === today.getFullYear() &&
      cutoff.getMonth() === today.getMonth() &&
      cutoff.getDate() === today.getDate()
    );
  }).length;
  const openBids = bids.filter((b) => b.status === 'SUBMITTED').length;
  const pendingPayouts = allocations.filter((a) => a.payoutStatus !== 'PAID').length;

  const kpiCards = [
    {
      label: 'Open demand pools',
      value: cycles.length,
      icon: StackIcon,
      chip: { text: `${cycles.filter((c) => c.myBid).length} bid on`, tone: 'info' as const },
    },
    {
      label: 'Closing today',
      value: closingToday,
      icon: AlarmIcon,
      chip:
        closingToday > 0
          ? { text: 'Urgent', tone: 'danger' as const }
          : { text: 'None today', tone: 'success' as const },
    },
    {
      label: 'Bids submitted',
      value: bids.length,
      icon: ClockIcon,
      chip: { text: `${openBids} still open`, tone: 'info' as const },
    },
    {
      label: 'Awarded',
      value: allocations.length,
      icon: TrophyIcon,
      chip:
        pendingPayouts > 0
          ? { text: `${pendingPayouts} pending payout`, tone: 'warning' as const }
          : { text: 'All paid out', tone: 'success' as const },
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-1 text-xs text-muted-foreground">Seller portal</div>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">
        Welcome back, {profile!.user.businessName ?? profile!.user.name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Trust score {profile!.trustScore} · Serving {profile!.regionsServed.join(', ')}
      </p>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Open demand pools</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Blind bidding — you&apos;ll never see other sellers&apos; bids or buyer identities, only the
        aggregated demand.
      </p>

      {cycles.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <ClockIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No open cycles match your regions right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="border-t border-r border-border p-6">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate">
                  {cycle.region ?? 'National'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ClockIcon className="size-3" />
                  {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div className="mb-0.5 text-[15px] font-bold text-ink">{cycle.material.name}</div>
              <div className="mb-3.5 text-xs text-muted-foreground">{cycle.material.category}</div>
              {cycle.material.spec && (
                <div className="mb-4 text-[12.5px] leading-relaxed text-slate">{cycle.material.spec}</div>
              )}

              <div className="mb-1 flex justify-between text-[13px]">
                <span className="text-slate">Pooled demand</span>
                <span className="font-semibold text-ink">
                  {cycle.totalQuantityRequested} {cycle.material.unit}
                </span>
              </div>

              {cycle.myBid && (
                <div className="mt-3 flex items-start gap-1.5 rounded-md bg-well px-3 py-2.5 text-[12.5px] text-ink">
                  <CheckCircleIcon className="mt-0.5 size-3.5 shrink-0 text-brand" />
                  <span>
                    Your bid: <span className="font-bold">{formatNaira(cycle.myBid.unitPrice)}</span> for{' '}
                    <span className="font-bold">
                      {cycle.myBid.quantityOffered} {cycle.material.unit}
                    </span>
                  </span>
                </div>
              )}

              <div className="mt-4">
                <BidDialog sellerId={sellerId} cycle={cycle} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
