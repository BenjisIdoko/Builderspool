import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerPayouts } from '@/lib/queries/sellerPortal';
import { AnimatedNaira } from '@/components/ui/animated-number';
import { PayoutTable, type PayoutRow } from '@/components/seller/payout-table';

export const metadata = { title: 'Payouts' };

const DATE = { dateStyle: 'medium', timeZone: 'Africa/Lagos' } as const;

export default async function SellerPayoutsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const all = await getSellerPayouts(sellerId);

  const paid = all.filter((p) => p.status === 'PAID');
  const pending = all.filter((p) => p.status === 'PENDING_GRN' || p.status === 'PROCESSED');
  const onHold = all.filter((p) => p.status === 'ON_HOLD');
  const sum = (rows: typeof all) => rows.reduce((total, p) => total + p.amount, 0);

  const payouts: PayoutRow[] = all.map((p) => ({
    id: p.id,
    source: p.source,
    materialName: p.materialName,
    amount: p.amount,
    status: p.status,
    reference: p.reference,
    date: p.paidAt ? p.paidAt.toLocaleDateString('en-NG', DATE) : null,
  }));

  const cards = [
    { label: 'Paid out', amount: sum(paid), note: `${paid.length} paid`, tone: 'text-ink' },
    { label: 'On its way', amount: sum(pending), note: `${pending.length} awaiting receipt or payment`, tone: 'text-ink' },
    { label: 'On hold', amount: sum(onHold), note: `${onHold.length} paused by our team`, tone: onHold.length > 0 ? 'text-danger' : 'text-ink' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · settlements</div>
      <h1 className="mb-1 text-heading-lg text-ink">Payouts</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Money from every order you&apos;ve won, whether by bid, RFQ or Buy Direct. We pay you once the fulfilment centre confirms it has received your goods.
        Our team sends the payment, so there&apos;s no withdraw button yet.
      </p>

      <dl className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card bg-card-alt p-5 shadow-[0_0_0_1px_var(--color-hairline)]">
            <dt className="mb-1.5 text-label text-muted-foreground uppercase">{c.label}</dt>
            <dd className={`font-mono text-figure-lg tabular-nums ${c.tone}`}>
              <AnimatedNaira value={c.amount} />
            </dd>
            <dd className="mt-1 text-pretty text-xs text-muted-foreground">{c.note}</dd>
          </div>
        ))}
      </dl>

      <PayoutTable payouts={payouts} />
    </div>
  );
}
