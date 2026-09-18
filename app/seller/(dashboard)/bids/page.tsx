import { ClockIcon, StackIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerBids } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { bidStatusTone, pillClass } from '@/lib/statusColors';
import { withdrawBid } from '../../actions';
import { MaterialImage } from '@/components/material-image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function SellerBidsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const bids = await getSellerBids(sellerId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">My bids</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every bid you&apos;ve submitted, across every cycle — withdraw one while it&apos;s still open.
      </p>

      {bids.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <StackIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven&apos;t submitted any bids yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="divide-y divide-border">
            {bids.map((bid) => (
              <div key={bid.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <MaterialImage
                  imageUrl={bid.material.imageUrl}
                  category={bid.material.category}
                  alt={bid.material.name}
                  className="size-12 shrink-0 rounded-md border border-border"
                  sizes="48px"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{bid.material.name}</span>
                    <Badge variant="outline" className={pillClass(bidStatusTone(bid.status))}>
                      {bid.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <StackIcon className="size-3.5" />
                      {bid.quantityOffered} {bid.material.unit}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TruckIcon className="size-3.5" />
                      {bid.estimatedDeliveryDays}-day delivery
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="size-3.5" />
                      {bid.submittedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="font-bold tabular-nums text-ink">{formatNaira(bid.unitPrice)}</div>

                {bid.status === 'SUBMITTED' && (
                  <form action={withdrawBid}>
                    <input type="hidden" name="bidId" value={bid.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Withdraw
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
