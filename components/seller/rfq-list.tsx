import Link from 'next/link';
import { CaretRightIcon, ClockIcon, MapPinIcon, StackIcon } from '@phosphor-icons/react/ssr';
import { Money } from '@/components/money';
import { Badge } from '@/components/ui/badge';
import { formatLagosDateTime } from '@/lib/format';
import type { getSellerRfqs } from '@/lib/queries/sheets';

type Rfq = Awaited<ReturnType<typeof getSellerRfqs>>[number];

const SHEET_STATUS = {
  OPEN: { label: 'Collecting orders', variant: 'outline' },
  BIDDING: { label: 'Open for bids', variant: 'pool' },
  AWARDING: { label: 'Bids closed', variant: 'warning' },
  AWARDED: { label: 'Awarded', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
} as const;

const BID_STATUS = {
  SUBMITTED: { label: 'Bid sent', variant: 'outline' },
  ELIGIBLE: { label: 'Bid sent', variant: 'outline' },
  INELIGIBLE: { label: 'Ruled out', variant: 'danger' },
} as const;

// One badge for the seller's own position: what happened to their bid beats the
// plain "bid sent", so a row never carries three badges at once.
function myPosition(bid: NonNullable<Rfq['myBid']>) {
  const award = bid.award;
  if (award?.status === 'OFFERED') return { label: 'Offer waiting for you', variant: 'warning' } as const;
  if (award?.status === 'WAITING') return { label: `Waiting your turn (rank ${award.rank})`, variant: 'outline' } as const;
  if (award?.status === 'ACCEPTED') return { label: 'You won this RFQ', variant: 'success' } as const;
  return BID_STATUS[bid.status];
}

export function SellerRfqList({ rfqs }: { rfqs: Rfq[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg bg-card-alt">
      {rfqs.map((r) => {
        const status = SHEET_STATUS[r.status];
        const mine = r.myBid ? myPosition(r.myBid) : null;
        const closed = r.status !== 'BIDDING' && r.status !== 'OPEN';
        return (
          <li key={r.id}>
            <Link
              href={`/seller/rfqs/${r.id}`}
              className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 outline-none transition-colors duration-150 hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-pretty font-bold text-ink">{r.category}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {mine && <Badge variant={mine.variant}>{mine.label}</Badge>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon className="size-3.5" />
                    {r.zoneName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <StackIcon className="size-3.5" />
                    {r.lineCount} {r.lineCount === 1 ? 'item' : 'items'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5" />
                    {closed ? 'Bids closed' : 'Bids close'} {formatLagosDateTime(r.bidsCloseAt)}
                  </span>
                </div>
              </div>
              {r.myBid && (
                <div className="text-right">
                  <div className="font-mono font-medium tabular-nums text-ink">
                    <Money amount={r.myBid.totalAmount} />
                  </div>
                  <div className="text-caption text-slate">your bid</div>
                </div>
              )}
              <CaretRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
