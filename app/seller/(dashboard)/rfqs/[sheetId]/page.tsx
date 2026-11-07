import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getRfq } from '@/lib/queries/sheets';
import { MaterialImage } from '@/components/material-image';
import { Money } from '@/components/money';
import { Badge } from '@/components/ui/badge';
import { RfqBidForm } from '@/components/seller/rfq-bid-form';

export const metadata = { title: 'RFQ' };

const closesText = (d: Date) => d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' });

const BID_STATUS = {
  SUBMITTED: { label: 'Bid sent', variant: 'outline' },
  ELIGIBLE: { label: 'Eligible', variant: 'success' },
  INELIGIBLE: { label: 'Ruled out', variant: 'danger' },
} as const;

// "ABOVE_REFERENCE: Cement bid at ₦950, above the ₦900 reference" -> the sentence after the code.
const reasonText = (reason: string | null) => (reason ? reason.split(': ').slice(1).join(': ') || reason : null);

export default async function SellerRfqPage({ params }: { params: Promise<{ sheetId: string }> }) {
  const { sheetId } = await params;
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');
  const rfq = await getRfq(sheetId, sellerId);
  if (!rfq) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-4xl">
      <Link href="/seller/rfqs" className="mb-3 inline-flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeftIcon className="size-4" />
        All RFQs
      </Link>
      <div className="mb-1 text-xs text-muted-foreground">Merchant · request for quotation</div>
      <h1 className="mb-1 text-heading-lg text-ink">{rfq.category}</h1>
      <p className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{rfq.zoneName}</span>
        <span className="flex items-center gap-1.5">
          <ClockIcon className="size-3.5" />
          Bids close {closesText(rfq.bidsCloseAt)}
        </span>
      </p>
      <p className="mb-6 text-sm text-muted-foreground">
        Bids are blind: you cannot see other vendors&apos; prices. Price every item. A price above an item&apos;s reference rules out your whole bid.
      </p>

      {rfq.myBid && (
        <div className="mb-4 rounded-lg bg-card-alt px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={BID_STATUS[rfq.myBid.status].variant}>{BID_STATUS[rfq.myBid.status].label}</Badge>
              <span className="text-sm text-muted-foreground">Sent {closesText(rfq.myBid.submittedAt)}</span>
            </div>
            <span className="font-mono text-figure-lg tabular-nums text-ink">
              <Money amount={rfq.myBid.totalAmount} />
            </span>
          </div>
          {rfq.myBid.status === 'INELIGIBLE' && <p className="mt-2 text-sm text-danger">{reasonText(rfq.myBid.reason)}</p>}
          {rfq.myBid.status === 'SUBMITTED' && <p className="mt-2 text-sm text-muted-foreground">Your bid is in. It is checked when bids close, and it cannot be changed.</p>}
        </div>
      )}

      {rfq.canBid ? (
        <RfqBidForm sheetId={rfq.id} lines={rfq.lines} />
      ) : (
        <>
          {rfq.blockedReason && <p className="mb-4 rounded-md bg-surface px-4 py-3 text-sm text-ink">{rfq.blockedReason}</p>}
          <ul className="divide-y divide-hairline overflow-hidden rounded-lg bg-card-alt">
            {rfq.lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
                <MaterialImage imageUrl={l.imageUrl} category={l.category} alt={l.name} className="size-16 shrink-0 rounded-md border border-border" sizes="64px" />
                <div className="min-w-0 flex-1 basis-48">
                  <div className="font-bold text-ink">{l.name}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {l.quantity.toLocaleString('en-NG')} × {l.unit}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {l.referencePrice === null ? 'No reference price' : <>Reference <Money amount={l.referencePrice} /> each</>}
                  </div>
                </div>
                {l.myPrice !== null && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Your price</div>
                    <div className="font-mono font-medium tabular-nums text-ink">
                      <Money amount={l.myPrice} />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
