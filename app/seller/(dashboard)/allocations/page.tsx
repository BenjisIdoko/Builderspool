import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'text-slate',
  CONFIRMED: 'text-accent',
  FULFILLED: 'text-accent',
  CANCELLED: 'text-muted',
};

export default async function SellerAllocationsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const allocations = await getSellerAllocations(sellerId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-1 text-xl font-medium tracking-tight text-ink">Allocations</h1>
      <p className="mb-6 text-sm text-muted">
        Materials awarded to you. Drop off at the fulfillment center listed — it confirms receipt (GRN),
        which is what triggers your payout.
      </p>

      {allocations.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          Nothing awarded to you yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {allocations.map((allocation) => (
            <div key={allocation.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-muted">{allocation.bid.material.category}</span>
                  <h2 className="text-[15px] font-medium text-ink">{allocation.bid.material.name}</h2>
                  <p className="text-sm text-slate">
                    {allocation.quantityFilled} {allocation.bid.material.unit}
                  </p>
                </div>
                <span className={`text-sm ${STATUS_STYLES[allocation.status] ?? 'text-ink'}`}>
                  {allocation.status.toLowerCase()}
                </span>
              </div>

              <div className="mt-4 rounded-md border border-border bg-canvas p-4">
                <div className="text-xs text-muted">Drop off at</div>
                {allocation.orderItem.fulfillmentCenter ? (
                  <>
                    <div className="text-sm font-medium text-ink">
                      {allocation.orderItem.fulfillmentCenter.name}
                    </div>
                    <div className="text-sm text-slate">{allocation.orderItem.fulfillmentCenter.address}</div>
                  </>
                ) : (
                  <div className="text-sm text-muted">No fulfillment center on record for this order item.</div>
                )}
              </div>

              {allocation.receivedAt && (
                <p className="mt-3 text-sm text-accent">
                  Received {allocation.receivedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
