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
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · settlements</div>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Payouts</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escrow releases to you — real allocation data, the same figures admin sees on the Escrow
        settlement desk. Payouts are disbursed by ops once a fulfillment center confirms receipt (GRN);
        there&apos;s no self-service withdrawal yet.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Paid out</div>
          <div className="text-2xl font-extrabold text-ink">{formatNaira(paidTotal)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{paid.length} settled</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Pending escrow release
          </div>
          <div className="text-2xl font-extrabold text-brand">{formatNaira(pendingTotal)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{pending.length} awaiting GRN / processing</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">On hold</div>
          <div className="text-2xl font-extrabold text-danger">{formatNaira(onHoldTotal)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{onHold.length} flagged by ops</div>
        </div>
      </div>

      <PayoutTable payouts={payouts} />
    </div>
  );
}
