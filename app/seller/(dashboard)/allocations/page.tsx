import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          Nothing awarded to you yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {allocations.map((allocation) => (
            <Card key={allocation.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">{allocation.bid.material.category}</span>
                  <h2 className="text-[15px] font-bold text-ink">{allocation.bid.material.name}</h2>
                  <p className="text-sm text-slate">
                    {allocation.quantityFilled} {allocation.bid.material.unit}
                  </p>
                </div>
                <Badge variant="outline" className={STATUS_BADGE_CLASS[allocation.status]}>
                  {allocation.status.toLowerCase()}
                </Badge>
              </div>

              <div className="mt-4 rounded-md border border-border bg-canvas p-4">
                <div className="text-xs text-muted-foreground">Drop off at</div>
                {allocation.orderItem.fulfillmentCenter ? (
                  <>
                    <div className="text-sm font-medium text-ink">
                      {allocation.orderItem.fulfillmentCenter.name}
                    </div>
                    <div className="text-sm text-slate">{allocation.orderItem.fulfillmentCenter.address}</div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No fulfillment center on record for this order item.</div>
                )}
              </div>

              {allocation.receivedAt && (
                <p className="mt-3 text-sm text-brand">
                  Received {allocation.receivedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
