import { ClockIcon, MapPinIcon, StackIcon, TrophyIcon, CheckCircleIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile, getOpenCyclesForSeller } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { submitBid } from '../actions';
import { MaterialImage } from '@/components/material-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
          <div className="text-sm font-bold text-ink">{profile!.user.businessName ?? profile!.user.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-4" />
            Serves {profile!.regionsServed.join(', ')}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-well px-3.5 py-2">
          <TrophyIcon className="size-4 text-brand" />
          <span className="text-sm text-slate">Trust score</span>
          <span className="text-sm font-bold text-ink">{profile!.trustScore}</span>
        </div>
      </div>

      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Open cycles</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Blind bidding — you&apos;ll never see other sellers&apos; bids or buyer identities, only the
        aggregated demand.
      </p>

      {cycles.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <ClockIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No open cycles match your regions right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {cycles.map((cycle) => (
            <Card key={cycle.id} className="gap-0 overflow-hidden py-0">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <MaterialImage
                    imageUrl={cycle.material.imageUrl}
                    category={cycle.material.category}
                    alt={cycle.material.name}
                    className="size-14 shrink-0 rounded-md border border-border"
                  />
                  <div>
                    <Badge variant="outline" className="mb-1 bg-well text-muted-foreground">
                      {cycle.material.category}
                    </Badge>
                    <h2 className="text-[15px] font-bold text-ink">{cycle.material.name}</h2>
                    {cycle.material.spec && <p className="text-sm text-slate">{cycle.material.spec}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-sm text-slate">
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon className="size-4" />
                    {cycle.region ?? 'National'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="size-4" />
                    Cutoff {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </CardContent>

              <CardContent className="flex items-center gap-1.5 px-5 pb-5 text-sm text-ink">
                <StackIcon className="size-4 text-brand" />
                Needed: <span className="font-bold">{cycle.totalQuantityRequested} {cycle.material.unit}</span>
              </CardContent>

              {cycle.myBid && (
                <CardContent className="px-5 pb-5">
                  <div className="flex items-center gap-2 rounded-md bg-well px-3.5 py-2.5 text-sm text-ink">
                    <CheckCircleIcon className="size-4 shrink-0 text-brand" />
                    Your current bid: <span className="font-bold">{formatNaira(cycle.myBid.unitPrice)}</span> for{' '}
                    <span className="font-bold">{cycle.myBid.quantityOffered} {cycle.material.unit}</span>,{' '}
                    {cycle.myBid.estimatedDeliveryDays}-day delivery — resubmit below to update it.
                  </div>
                </CardContent>
              )}

              <CardFooter className="bg-canvas">
                <form action={submitBid} className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
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
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
