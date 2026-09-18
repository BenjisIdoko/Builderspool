import Link from 'next/link';
import { WalletIcon, ClockIcon, CheckCircleIcon, CurrencyNgnIcon } from '@phosphor-icons/react/ssr';
import { getSavingsForAdmin } from '@/lib/wallet';
import { formatNaira } from '@/lib/format';
import { walletEntryTone, pillClass } from '@/lib/statusColors';
import { markWithdrawalPaidAction } from '@/app/admin/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const WALLET_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  WITHDRAWAL_REQUESTED: 'Requested',
  PAID: 'Paid',
};

const QUEUE_FILTERS = [
  { value: 'requested', label: 'Withdrawal requested' },
  { value: 'available', label: 'Available' },
  { value: 'paid', label: 'Paid' },
] as const;

export default async function AdminSavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string }>;
}) {
  const { queue } = await searchParams;
  const validQueue = QUEUE_FILTERS.some((f) => f.value === queue) ? queue : undefined;

  const entries = await getSavingsForAdmin();

  const available = entries.filter((e) => e.state === 'AVAILABLE');
  const requested = entries.filter((e) => e.state === 'WITHDRAWAL_REQUESTED');
  const paid = entries.filter((e) => e.state === 'PAID');

  const queueMap: Record<string, typeof entries> = { requested, available, paid };
  const rows = validQueue ? queueMap[validQueue] : entries;

  const allTimeCredited = entries.reduce((sum, e) => sum + Number(e.buyerShare), 0);
  const requestedValue = requested.reduce((sum, e) => sum + Number(e.buyerShare), 0);

  const kpiCards = [
    {
      label: 'Withdrawal requested',
      value: String(requested.length),
      icon: ClockIcon,
      tone: requested.length > 0 ? ('warning' as const) : ('success' as const),
      chip: formatNaira(requestedValue),
    },
    {
      label: 'Available, not yet requested',
      value: String(available.length),
      icon: WalletIcon,
      tone: 'info' as const,
      chip: `${available.length} buyer entries`,
    },
    {
      label: 'Paid out',
      value: String(paid.length),
      icon: CheckCircleIcon,
      tone: 'success' as const,
      chip: 'All-time',
    },
    {
      label: 'Total credited',
      value: formatNaira(allTimeCredited),
      icon: CurrencyNgnIcon,
      tone: 'info' as const,
      chip: 'Buyer share, all-time',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Savings settlement</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every buyer&apos;s real savings-wallet entry — half of the gap between what they paid and what a
        material actually cost to procure, credited once a GRN confirms real fulfillment.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1">
        <Link href="/admin/savings">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              !validQueue ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
            }`}
          >
            All ({entries.length})
          </span>
        </Link>
        {QUEUE_FILTERS.map((f) => (
          <Link key={f.value} href={`/admin/savings?queue=${f.value}`}>
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
          <WalletIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing in this queue right now.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Reference → actual</TableHead>
                <TableHead>Buyer share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="py-3 text-ink">
                    <div className="max-w-40 truncate">{entry.buyer.businessName ?? entry.buyer.name}</div>
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    <div className="max-w-40 truncate">{entry.allocation.bid.material.name}</div>
                  </TableCell>
                  <TableCell className="py-3 text-ink">
                    <div className="text-xs text-muted-foreground">
                      {formatNaira(Number(entry.referenceValue))} → {formatNaira(Number(entry.actualValue))}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 font-semibold text-ink">
                    {formatNaira(Number(entry.buyerShare))}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={pillClass(walletEntryTone(entry.state))}>
                      {WALLET_LABEL[entry.state]}
                    </Badge>
                    {entry.state === 'PAID' && entry.paymentReference && (
                      <div className="mt-1 text-xs text-muted-foreground">{entry.paymentReference}</div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {entry.state === 'WITHDRAWAL_REQUESTED' && (
                      <form action={markWithdrawalPaidAction}>
                        <input type="hidden" name="entryId" value={entry.id} />
                        <Button type="submit" size="sm">
                          Mark paid
                        </Button>
                      </form>
                    )}
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
