import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile, getOpenCyclesForSeller } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { submitBid } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
          <div className="text-sm text-muted-foreground">Serves {profile!.regionsServed.join(', ')}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate">Trust score</div>
          <div className="text-lg font-medium text-ink">{profile!.trustScore}</div>
        </div>
      </div>

      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Open cycles</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Blind bidding — you&apos;ll never see other sellers&apos; bids or buyer identities, only the
        aggregated demand.
      </p>

      {cycles.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          No open cycles match your regions right now.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs text-muted-foreground">{cycle.material.category}</span>
                <h2 className="text-[15px] font-semibold text-ink">{cycle.material.name}</h2>
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
              <p className="mt-2 text-sm text-brand">
                Your current bid: {formatNaira(cycle.myBid.unitPrice)} for {cycle.myBid.quantityOffered}{' '}
                {cycle.material.unit}, {cycle.myBid.estimatedDeliveryDays}-day delivery — resubmit below to
                update it.
              </p>
            )}

            <form action={submitBid} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <input type="hidden" name="sellerId" value={sellerId} />
              <input type="hidden" name="cycleId" value={cycle.id} />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`unitPrice-${cycle.id}`}>Unit price (₦)</Label>
                <Input
                  id={`unitPrice-${cycle.id}`}
                  type="number"
                  name="unitPrice"
                  min="1"
                  step="1"
                  required
                  defaultValue={cycle.myBid?.unitPrice}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`quantityOffered-${cycle.id}`}>Quantity offered</Label>
                <Input
                  id={`quantityOffered-${cycle.id}`}
                  type="number"
                  name="quantityOffered"
                  min="1"
                  step="1"
                  required
                  defaultValue={cycle.myBid?.quantityOffered}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`estimatedDeliveryDays-${cycle.id}`}>Delivery (days)</Label>
                <Input
                  id={`estimatedDeliveryDays-${cycle.id}`}
                  type="number"
                  name="estimatedDeliveryDays"
                  min="0"
                  step="1"
                  required
                  defaultValue={cycle.myBid?.estimatedDeliveryDays}
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  {cycle.myBid ? 'Update bid' : 'Submit bid'}
                </Button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
