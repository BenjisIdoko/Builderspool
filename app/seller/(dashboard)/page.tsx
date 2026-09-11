import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile, getOpenCyclesForSeller } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { submitBid } from '../actions';

export default async function SellerDashboardPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const [profile, cycles] = await Promise.all([
    getSellerProfile(sellerId),
    getOpenCyclesForSeller(sellerId),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <div>
          <div className="text-sm font-medium text-ink">{profile!.user.businessName ?? profile!.user.name}</div>
          <div className="text-sm text-muted">Serves {profile!.regionsServed.join(', ')}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate">Trust score</div>
          <div className="text-lg font-medium text-ink">{profile!.trustScore}</div>
        </div>
      </div>

      <h1 className="mb-1 text-xl font-medium tracking-tight text-ink">Open cycles</h1>
      <p className="mb-6 text-sm text-muted">
        Blind bidding — you&apos;ll never see other sellers&apos; bids or buyer identities, only the
        aggregated demand.
      </p>

      {cycles.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No open cycles match your regions right now.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs text-muted">{cycle.material.category}</span>
                <h2 className="text-[15px] font-medium text-ink">{cycle.material.name}</h2>
                {cycle.material.spec && <p className="text-sm text-slate">{cycle.material.spec}</p>}
              </div>
              <div className="text-right text-sm text-slate">
                <div>{cycle.region ?? 'National'}</div>
                <div>Cutoff {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-ink">
              Needed: <span className="font-medium">{cycle.totalQuantityRequested} {cycle.material.unit}</span>
            </div>

            {cycle.myBid && (
              <p className="mt-2 text-sm text-accent">
                Your current bid: {formatNaira(cycle.myBid.unitPrice)} for {cycle.myBid.quantityOffered}{' '}
                {cycle.material.unit}, {cycle.myBid.estimatedDeliveryDays}-day delivery — resubmit below to
                update it.
              </p>
            )}

            <form action={submitBid} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <input type="hidden" name="sellerId" value={sellerId} />
              <input type="hidden" name="cycleId" value={cycle.id} />

              <label className="text-sm">
                <span className="mb-1 block text-slate">Unit price (₦)</span>
                <input
                  type="number"
                  name="unitPrice"
                  min="1"
                  step="1"
                  required
                  defaultValue={cycle.myBid?.unitPrice}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-slate">Quantity offered</span>
                <input
                  type="number"
                  name="quantityOffered"
                  min="1"
                  step="1"
                  required
                  defaultValue={cycle.myBid?.quantityOffered}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-slate">Delivery (days)</span>
                <input
                  type="number"
                  name="estimatedDeliveryDays"
                  min="0"
                  step="1"
                  required
                  defaultValue={cycle.myBid?.estimatedDeliveryDays}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {cycle.myBid ? 'Update bid' : 'Submit bid'}
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
