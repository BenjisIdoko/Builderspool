import { StackIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { allocationStatusTone, payoutStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { MaterialImage } from '@/components/material-image';

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  PENDING_GRN: 'Payout pending GRN',
  PROCESSED: 'Payout cleared',
  PAID: 'Payout sent',
  ON_HOLD: 'Payout on hold',
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
        <div>
          <div className="grid grid-cols-[2fr_1fr_2fr_1.2fr] gap-4 border-b border-ink pb-3 text-[12.5px] font-semibold text-slate">
            <div>Allocation</div>
            <div>Quantity</div>
            <div>Drop-off center</div>
            <div>Payout status</div>
          </div>
          {allocations.map((allocation) => (
            <div
              key={allocation.id}
              className="grid grid-cols-[2fr_1fr_2fr_1.2fr] items-center gap-4 border-b border-border py-4 text-sm"
            >
              <div className="flex items-center gap-3">
                <MaterialImage
                  imageUrl={allocation.bid.material.imageUrl}
                  category={allocation.bid.material.category}
                  alt={allocation.bid.material.name}
                  className="size-11 shrink-0 rounded-md border border-border"
                />
                <div>
                  <div className="font-semibold text-ink">{allocation.bid.material.name}</div>
                  <Badge variant="outline" className={`${pillClass(allocationStatusTone(allocation.status))} mt-0.5`}>
                    {allocation.status.toLowerCase()}
                  </Badge>
                </div>
              </div>

              <div className="text-ink">
                {allocation.quantityFilled} {allocation.bid.material.unit}
              </div>

              <div>
                {allocation.orderItem.fulfillmentCenter ? (
                  <>
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <TruckIcon className="size-3.5 shrink-0 text-brand" />
                      {allocation.orderItem.fulfillmentCenter.name}
                    </div>
                    <div className="text-xs text-slate">{allocation.orderItem.fulfillmentCenter.address}</div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No fulfillment center on record.</span>
                )}
                {allocation.receivedAt && (
                  <div className="mt-1 text-xs text-brand">
                    Received {allocation.receivedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                    {allocation.grnNumber && <span className="ml-1 text-muted-foreground">{allocation.grnNumber}</span>}
                  </div>
                )}
              </div>

              <div>
                <Badge variant="outline" className={pillClass(payoutStatusTone(allocation.payoutStatus))}>
                  {PAYOUT_STATUS_LABEL[allocation.payoutStatus]}
                </Badge>
                {allocation.payoutStatus === 'PAID' && allocation.payoutReference && (
                  <div className="mt-1 text-xs text-muted-foreground">{allocation.payoutReference}</div>
                )}
                {allocation.payoutStatus === 'ON_HOLD' && allocation.holdReason && (
                  <div className="mt-1 text-xs text-danger">{allocation.holdReason}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
