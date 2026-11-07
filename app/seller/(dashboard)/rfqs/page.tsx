import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardTextIcon, ClockIcon, StackIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerRfqs } from '@/lib/queries/sheets';
import { Money } from '@/components/money';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'RFQs' };

const SHEET_STATUS = {
  OPEN: { label: 'Collecting orders', variant: 'outline' },
  BIDDING: { label: 'Open for bids', variant: 'pool' },
  AWARDING: { label: 'Bids closed', variant: 'warning' },
  AWARDED: { label: 'Awarded', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
} as const;

const BID_STATUS = {
  SUBMITTED: { label: 'Bid sent', variant: 'outline' },
  ELIGIBLE: { label: 'Eligible', variant: 'success' },
  INELIGIBLE: { label: 'Ruled out', variant: 'danger' },
} as const;

const closesText =(d: Date) => d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' });

export default async function SellerRfqsPage() {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');
  const rfqs = await getSellerRfqs(sellerId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-5xl">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · bidding</div>
      <h1 className="mb-1 text-heading-lg text-ink">RFQs</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Each request is one category in one delivery zone, with every item the pool ordered that day. Price every item and send one bid. Per-material bids
        are on <Link href="/seller/bids" className="font-semibold text-brand hover:underline">My bids</Link>.
      </p>

      {rfqs.length === 0 ? (
        <div className="rounded-lg bg-card-alt px-6 py-16 text-center">
          <ClipboardTextIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No requests for you right now. You receive them for the categories and delivery zones BuildersPool has approved for you; ask for more in{' '}
            <Link href="/seller/settings" className="font-semibold text-brand hover:underline">Settings</Link>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-card-alt">
          <ul className="divide-y divide-border">
            {rfqs.map((r) => {
              const status = SHEET_STATUS[r.status];
              return (
                <li key={r.id}>
                  <Link href={`/seller/rfqs/${r.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-surface">
                    <div className="min-w-0 flex-1 basis-56">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{r.category}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {r.myBid && <Badge variant={BID_STATUS[r.myBid.status].variant}>{BID_STATUS[r.myBid.status].label}</Badge>}
                        {r.myBid?.award?.status === 'OFFERED' && <Badge variant="warning">Offer waiting: rank {r.myBid.award.rank}</Badge>}
                        {r.myBid?.award?.status === 'ACCEPTED' && <Badge variant="success">You won this sheet</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{r.zoneName}</span>
                        <span className="flex items-center gap-1.5">
                          <StackIcon className="size-3.5" />
                          {r.lineCount} {r.lineCount === 1 ? 'item' : 'items'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="size-3.5" />
                          Bids close {closesText(r.bidsCloseAt)}
                        </span>
                      </div>
                    </div>
                    {r.myBid && (
                      <div className="font-mono font-medium tabular-nums text-ink">
                        <Money amount={r.myBid.totalAmount} />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
