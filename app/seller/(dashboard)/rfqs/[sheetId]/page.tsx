import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getRfq } from '@/lib/queries/sheets';
import { MaterialImage } from '@/components/material-image';
import { Money } from '@/components/money';
import { Badge } from '@/components/ui/badge';
import { RfqBidForm } from '@/components/seller/rfq-bid-form';
import { SheetAwardResponse } from '@/components/seller/sheet-award-response';

export const metadata = { title: 'RFQ' };

const closesText = (d: Date) => d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' });

const BID_STATUS = {
  SUBMITTED: { label: 'Bid sent', variant: 'outline' },
  ELIGIBLE: { label: 'Eligible', variant: 'success' },
  INELIGIBLE: { label: 'Ruled out', variant: 'danger' },
} as const;

const CRITERION_LABEL = {
  PRICE: 'Price',
  PERFORMANCE: 'Performance',
  CAPACITY: 'Capacity',
  DELIVERY: 'Delivery',
  GEOGRAPHY: 'Geography',
  RESPONSIVENESS: 'Responsiveness',
} as const;

// "ABOVE_REFERENCE: Cement bid at ₦950, above the ₦900 reference" -> the sentence after the code.
const reasonText = (reason: string | null) => (reason ? reason.split(': ').slice(1).join(': ') || reason : null);

export default async function SellerRfqPage({ params }: { params: Promise<{ sheetId: string }> }) {
  const { sheetId } = await params;
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');
  const rfq = await getRfq(sheetId, sellerId);
  if (!rfq) notFound();

  const award = rfq.myBid?.award ?? null;
  const offerOpen = award?.open ?? false;

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
        Bids are blind: you cannot see other vendors&apos; prices. Price every item. A price above an item&apos;s limit rules out your whole bid.
      </p>

      {offerOpen && award?.expiresAt && (
        <div className="mb-4 rounded-lg border border-cyan/30 bg-pale-blue px-5 py-4">
          <h2 className="text-heading-sm text-ink">You are rank {award.rank}: this sheet is offered to you</h2>
          <p className="mt-1 mb-4 text-sm text-ink">
            Accept to supply every item on this sheet at your bid prices. The offer closes at <strong>{closesText(award.expiresAt)}</strong>; if you do not answer,
            it passes to the next ranked vendor.
          </p>
          <SheetAwardResponse sheetId={rfq.id} awardId={award.id} />
        </div>
      )}
      {award?.status === 'ACCEPTED' && (
        <p className="mb-4 rounded-md border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">You accepted this sheet as rank {award.rank}. It is yours to supply.</p>
      )}
      {award?.status === 'DECLINED' && <p className="mb-4 rounded-md bg-surface px-4 py-3 text-sm text-ink">You declined this offer. It passed to the next ranked vendor.</p>}
      {award && (award.status === 'EXPIRED' || (award.status === 'OFFERED' && !offerOpen)) && (
        <p className="mb-4 rounded-md bg-surface px-4 py-3 text-sm text-ink">
          {award.declineReason ?? 'The offer window ended before it was accepted, so it passed on.'}
        </p>
      )}
      {rfq.myBid && rfq.myBid.status === 'ELIGIBLE' && !award && rfq.status !== 'BIDDING' && (
        <p className="mb-4 rounded-md bg-surface px-4 py-3 text-sm text-ink">Your bid was eligible but did not rank in the top three, so no offer was made to you.</p>
      )}

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

      {award?.status === 'ACCEPTED' && rfq.supply.length > 0 && (
        <section className="mb-4 rounded-lg bg-card-alt px-5 py-4" aria-labelledby="supply-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="supply-heading" className="text-heading-sm text-ink">What you supply</h2>
            <span className="font-mono tabular-nums text-ink">
              <Money amount={rfq.supply.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)} />
            </span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Send these to the fulfilment centre. You are paid at your bid price once the centre has received the goods and the quality check has passed.
          </p>
          <ul className="divide-y divide-hairline">
            {rfq.supply.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <div className="min-w-0 basis-60 flex-1">
                  <div className="text-sm font-medium text-ink">
                    {l.material} <span className="font-normal text-slate">× {l.quantity.toLocaleString('en-NG')} {l.unit}</span>
                  </div>
                  {l.center && (
                    <div className="text-sm text-muted-foreground">
                      Deliver to {l.center.name}, {l.center.address}
                    </div>
                  )}
                  {l.status === 'FAILED' && <div className="text-sm text-danger">Marked as not supplied{l.failReason ? `: ${l.failReason}` : ''}</div>}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm tabular-nums text-ink">
                    <Money amount={l.unitPrice * l.quantity} />
                  </div>
                  <div className="text-caption text-slate">
                    {l.status === 'PENDING' ? 'Awaiting goods' : l.status === 'FAILED' ? 'Not supplied' : l.payoutStatus === 'PAID' ? 'Paid' : l.payoutStatus === 'ON_HOLD' ? 'Received · payout on hold' : 'Received · payment due'}
                    {l.grnNumber ? ` · ${l.grnNumber}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rfq.myBid && rfq.myBid.scores.length > 0 && (
        <section className="mb-4 rounded-lg bg-card-alt px-5 py-4" aria-labelledby="score-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="score-heading" className="text-heading-sm text-ink">How your bid scored</h2>
            <span className="font-mono tabular-nums text-ink">{rfq.myBid.totalScore?.toFixed(2)} / 100</span>
          </div>
          <ul className="divide-y divide-hairline">
            {rfq.myBid.scores.map((s) => (
              <li key={s.criterion} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <div className="min-w-0 basis-60 flex-1">
                  <div className="text-sm font-medium text-ink">{CRITERION_LABEL[s.criterion]}</div>
                  <div className="text-sm text-muted-foreground">{s.reason}</div>
                </div>
                <span className="font-mono text-sm tabular-nums text-ink">
                  {s.points.toFixed(2)} <span className="text-slate">/ {s.weight}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
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
                    {l.ceiling === null ? (
                      'No limit set'
                    ) : (
                      <>
                        {l.ceiling.basis === 'REFERENCE' ? 'Reference' : 'Limit (lowest buyer price)'} <Money amount={l.ceiling.price} /> each
                      </>
                    )}
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
