import { StackIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MaterialImage } from '@/components/material-image';

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: 'bg-transparent text-slate border-border',
  CONFIRMED: 'bg-transparent text-brand border-brand/30',
  FULFILLED: 'bg-brand text-brand-ink',
  CANCELLED: 'bg-transparent text-muted-foreground border-border',
};

export default async function SellerAllocationsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const allocations = await getSellerAllocations(sellerId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Allocations</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Materials awarded to you. Drop off at the fulfillment center listed — it confirms receipt (GRN),
        which is what triggers your payout.
      </p>

      {allocations.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <StackIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing awarded to you yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {allocations.map((allocation) => (
            <Card key={allocation.id} className="gap-0 overflow-hidden py-0">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <MaterialImage
                    imageUrl={allocation.bid.material.imageUrl}
                    category={allocation.bid.material.category}
                    alt={allocation.bid.material.name}
                    className="size-14 shrink-0 rounded-md border border-border"
                  />
                  <div>
                    <Badge variant="outline" className="mb-1 bg-well text-muted-foreground">
                      {allocation.bid.material.category}
                    </Badge>
                    <h2 className="text-[15px] font-bold text-ink">{allocation.bid.material.name}</h2>
                    <p className="flex items-center gap-1.5 text-sm text-slate">
                      <StackIcon className="size-3.5" />
                      {allocation.quantityFilled} {allocation.bid.material.unit}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={STATUS_BADGE_CLASS[allocation.status]}>
                  {allocation.status.toLowerCase()}
                </Badge>
              </CardContent>

              <CardContent className="px-5 pb-5">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-canvas p-4">
                  <TruckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  <div>
                    <div className="text-xs text-muted-foreground">Drop off at</div>
                    {allocation.orderItem.fulfillmentCenter ? (
                      <>
                        <div className="text-sm font-bold text-ink">
                          {allocation.orderItem.fulfillmentCenter.name}
                        </div>
                        <div className="text-sm text-slate">{allocation.orderItem.fulfillmentCenter.address}</div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No fulfillment center on record for this order item.
                      </div>
                    )}
                  </div>
                </div>

                {allocation.receivedAt && (
                  <p className="mt-3 text-sm font-medium text-brand">
                    Received{' '}
                    {allocation.receivedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
