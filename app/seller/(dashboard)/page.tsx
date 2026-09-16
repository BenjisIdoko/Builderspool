import Link from 'next/link';
import {
  AlarmIcon,
  ClockIcon,
  StackIcon,
  TrophyIcon,
  CheckCircleIcon,
  IdentificationCardIcon,
  WarningIcon,
  SealCheckIcon,
  ChartLineUpIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile, getOpenCyclesForSeller, getSellerBids, getSellerAllocations } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { pillClass, payoutStatusTone } from '@/lib/statusColors';
import { BidDialog } from '@/components/seller/bid-dialog';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAYOUT_LABEL: Record<string, string> = {
  PENDING_GRN: 'Awaiting GRN',
  PROCESSED: 'Cleared',
  PAID: 'Paid',
  ON_HOLD: 'On hold',
};

const QUICK_ACTIONS = [
  { href: '/seller', label: 'View open demand pools' },
  { href: '/seller/bids', label: 'Review my bids' },
  { href: '/seller/allocations', label: 'View payout schedule' },
];

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
      value: String(cycles.length),
      icon: StackIcon,
      tone: 'info' as const,
      chip: `${cycles.filter((c) => c.myBid).length} bid on`,
    },
    {
      label: 'Closing today',
      value: String(closingToday),
      icon: AlarmIcon,
      tone: closingToday > 0 ? ('danger' as const) : ('success' as const),
      chip: closingToday > 0 ? 'Urgent' : 'None today',
    },
    {
      label: 'Bids submitted',
      value: String(bids.length),
      icon: ClockIcon,
      tone: 'info' as const,
      chip: `${openBids} still open`,
    },
    {
      label: 'Awarded',
      value: String(allocations.length),
      icon: TrophyIcon,
      tone: pendingPayouts > 0 ? ('warning' as const) : ('success' as const),
      chip: pendingPayouts > 0 ? `${pendingPayouts} pending payout` : 'All paid out',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        {profile!.kycStatus === 'APPROVED' ? (
          <Badge variant="outline" className={pillClass('success')}>
            <SealCheckIcon weight="fill" className="size-3" />
            KYC verified
          </Badge>
        ) : (
          <Link href="/seller/kyc">
            <Badge
              variant="outline"
              className={pillClass(profile!.kycStatus === 'PENDING' ? 'warning' : 'neutral')}
            >
              {profile!.kycStatus === 'PENDING' ? 'KYC pending review' : 'KYC not started'}
            </Badge>
          </Link>
        )}
        <Badge variant="outline" className={pillClass('info')}>
          <ChartLineUpIcon weight="fill" className="size-3" />
          Trust score {profile!.trustScore}
        </Badge>
      </div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">
        {profile!.user.businessName ?? profile!.user.name}
      </h1>
      <p className="mb-7 text-sm text-muted-foreground">Serving {profile!.regionsServed.join(', ')}</p>

      {profile!.kycStatus !== 'APPROVED' && (
        <Link
          href="/seller/kyc"
          className={`mb-8 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors ${
            profile!.kycStatus === 'PENDING'
              ? 'border-warning/40 bg-warning-soft/60 text-warning hover:bg-warning-soft'
              : 'border-danger/40 bg-danger-soft/60 text-danger hover:bg-danger-soft'
          }`}
        >
          {profile!.kycStatus === 'PENDING' ? (
            <IdentificationCardIcon className="size-4 shrink-0" />
          ) : (
            <WarningIcon className="size-4 shrink-0" />
          )}
          {profile!.kycStatus === 'PENDING'
            ? 'Your KYC submission is pending admin review.'
            : profile!.kycStatus === 'REJECTED'
              ? `KYC rejected: ${profile!.kycRejectionReason ?? 'see details'} — resubmit to unlock payouts.`
              : 'Complete KYC verification to unlock payouts.'}
          <span className="ml-auto font-semibold underline">
            {profile!.kycStatus === 'NOT_SUBMITTED' ? 'Start now' : 'View'} →
          </span>
        </Link>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="mb-14 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-bold tracking-wide text-slate uppercase">Real-time order stream</h2>
            <Link href="/seller/allocations" className="text-sm font-semibold text-brand hover:underline">
              View all →
            </Link>
          </div>
          {allocations.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.05)]">
              <p className="text-sm text-muted-foreground">Nothing awarded to you yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.05)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requisition</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Escrow amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.slice(0, 6).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="py-3 font-semibold text-ink" title={a.id}>
                        #{a.id.slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="py-3 text-ink">
                        <div className="max-w-40 truncate">{a.bid.material.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.quantityFilled} {a.bid.material.unit}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold tabular-nums text-ink">
                        {formatNaira(Number(a.bid.unitPrice) * a.quantityFilled)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={pillClass(payoutStatusTone(a.payoutStatus))}>
                          {PAYOUT_LABEL[a.payoutStatus]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">Quick actions</div>
          <div className="flex flex-col">
            {QUICK_ACTIONS.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center justify-between gap-2 py-2.5 text-sm font-medium text-ink hover:text-brand ${
                  i < QUICK_ACTIONS.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {action.label}
                <ArrowRightIcon className="size-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
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
