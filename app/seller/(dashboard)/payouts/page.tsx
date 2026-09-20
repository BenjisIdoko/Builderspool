import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { PayoutTable, type PayoutRow } from '@/components/seller/payout-table';

export default async function SellerPayoutsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const allocations = await getSellerAllocations(sellerId);

  const amountOf = (a: (typeof allocations)[number]) => Number(a.bid.unitPrice) * a.quantityFilled;

  const paid = allocations.filter((a) => a.payoutStatus === 'PAID');
  const pending = allocations.filter((a) => a.payoutStatus === 'PENDING_GRN' || a.payoutStatus === 'PROCESSED');
  const onHold = allocations.filter((a) => a.payoutStatus === 'ON_HOLD');

  const paidTotal = paid.reduce((sum, a) => sum + amountOf(a), 0);
  const pendingTotal = pending.reduce((sum, a) => sum + amountOf(a), 0);
  const onHoldTotal = onHold.reduce((sum, a) => sum + amountOf(a), 0);

  const payouts: PayoutRow[] = allocations.map((a) => ({
    id: a.id,
    materialName: a.bid.material.name,
    amount: amountOf(a),
    status: a.payoutStatus,
    reference: a.payoutReference,
    date: a.paidAt ? a.paidAt.toLocaleDateString('en-NG', { dateStyle: 'medium' }) : null,
  }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pt-6 pb-20 sm:px-8 sm:pt-8">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · settlements</div>
      <h1 className="mb-1 text-[26px] font-bold tracking-tight text-ink">Payouts</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escrow releases to you — real allocation data, the same figures admin sees on the Escrow
        settlement desk. Payouts are disbursed by ops once a fulfillment center confirms receipt (GRN);
        there&apos;s no self-service withdrawal yet.
      </p>

      {/* Design's 3 cards are Available balance / Pending escrow release / Lifetime
          earnings. "Available balance" assumes self-service withdrawal, which
          doesn't exist here — "On hold" (real, ops-flagged) takes that slot
          instead. "Paid out" is literally the same real figure as "Lifetime
          earnings" (all-time payoutStatus=PAID total), just relabeled to match;
          no fabricated quarter-over-quarter trend added under it. */}
      <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">On hold</div>
          <div className="text-2xl font-extrabold text-danger">{formatNaira(onHoldTotal)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{onHold.length} flagged by ops</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Pending escrow release
          </div>
          <div className="text-2xl font-extrabold text-brand">{formatNaira(pendingTotal)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{pending.length} awaiting GRN / processing</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Lifetime earnings</div>
          <div className="text-2xl font-extrabold text-ink">{formatNaira(paidTotal)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{paid.length} settled</div>
        </div>
      </div>

      <PayoutTable payouts={payouts} />
    </div>
  );
}
