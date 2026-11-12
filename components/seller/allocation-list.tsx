import { TruckIcon } from '@phosphor-icons/react/ssr';
import { MaterialImage } from '@/components/material-image';
import { AwardResponse } from '@/components/seller/award-response';
import { Badge } from '@/components/ui/badge';
import { formatLagosDateTime } from '@/lib/format';
import { PAYOUT_LABEL } from '@/lib/labels';
import { allocationStatusTone, payoutStatusTone, pillClass } from '@/lib/statusColors';
import type { getSellerAllocations } from '@/lib/queries/sellerPortal';

type Allocation = Awaited<ReturnType<typeof getSellerAllocations>>[number];

const CANCEL_LABEL: Record<string, string> = {
  DECLINED: 'You declined this award.',
  EXPIRED: 'Not accepted in time, so it passed to the next supplier.',
  SELLER_SUSPENDED: 'Released because your account was suspended.',
};

function statusLabel(a: Allocation): string {
  if (a.status === 'PENDING') return a.acceptDeadlineAt ? 'Awaiting your reply' : 'Pending';
  if (a.status === 'CONFIRMED') return 'Accepted';
  if (a.status === 'FULFILLED') return 'Delivered';
  return 'Cancelled';
}

const ROW = 'sm:grid sm:grid-cols-[2fr_1fr_2fr_1.2fr] sm:items-center sm:gap-4';

// Each award as a row: what, how much, where to deliver it, and either a reply to give or the payout.
export function SellerAllocationList({ allocations }: { allocations: Allocation[] }) {
  return (
    <div className="overflow-hidden rounded-lg bg-card-alt">
      <div aria-hidden className={`hidden border-b border-border px-5 py-3 text-caption font-semibold text-slate ${ROW}`}>
        <div>Award</div>
        <div>Quantity</div>
        <div>Deliver to</div>
        <div>Payout</div>
      </div>
      <ul className="divide-y divide-border">
        {allocations.map((a) => {
          const awaitingReply = a.status === 'PENDING' && !!a.acceptDeadlineAt;
          const center = a.orderItem.fulfillmentCenter;
          return (
            <li key={a.id} className={`flex flex-col gap-3 px-5 py-4 text-sm ${ROW}`}>
              <div className="flex items-center gap-3">
                <MaterialImage
                  imageUrl={a.bid.material.imageUrl}
                  category={a.bid.material.category}
                  alt={a.bid.material.name}
                  className="size-11 shrink-0 rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  sizes="44px"
                />
                <div className="min-w-0">
                  <div className="text-pretty font-semibold text-ink">{a.bid.material.name}</div>
                  <Badge variant="outline" className={`${pillClass(allocationStatusTone(a.status))} mt-0.5`}>
                    {statusLabel(a)}
                  </Badge>
                  {a.cascadeRound > 0 && a.status !== 'CANCELLED' && <div className="mt-1 text-xs text-muted-foreground">Passed to you from another supplier</div>}
                </div>
              </div>

              <div className="text-ink">
                <span className="mr-1 text-xs text-muted-foreground sm:hidden">Quantity:</span>
                <span className="tabular-nums">{a.quantityFilled.toLocaleString('en-NG')}</span> {a.bid.material.unit}
                {awaitingReply && a.acceptDeadlineAt && (
                  <div className="mt-1 text-xs font-medium tabular-nums text-warning-text">Accept by {formatLagosDateTime(a.acceptDeadlineAt)}</div>
                )}
              </div>

              <div>
                <span className="mb-1 block text-xs font-semibold text-muted-foreground sm:hidden">Deliver to</span>
                {center ? (
                  <>
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <TruckIcon aria-hidden className="size-3.5 shrink-0 text-brand" />
                      {center.name}
                    </div>
                    <div className="text-pretty text-xs text-slate">{center.address}</div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No fulfilment centre on record.</span>
                )}
                {a.receivedAt && (
                  <div className="mt-1 text-xs tabular-nums text-brand">
                    Received {formatLagosDateTime(a.receivedAt)}
                    {a.grnNumber && <span className="ml-1 text-muted-foreground">{a.grnNumber}</span>}
                  </div>
                )}
              </div>

              {awaitingReply ? (
                <AwardResponse allocationId={a.id} />
              ) : a.status === 'CANCELLED' ? (
                <div className="text-pretty text-xs text-muted-foreground">{CANCEL_LABEL[a.cancelReason ?? ''] ?? 'This award was withdrawn.'}</div>
              ) : (
                <div>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground sm:hidden">Payout</span>
                  <Badge variant="outline" className={pillClass(payoutStatusTone(a.payoutStatus))}>
                    {PAYOUT_LABEL[a.payoutStatus]}
                  </Badge>
                  {a.payoutStatus === 'PAID' && a.payoutReference && <div className="mt-1 font-mono text-xs text-muted-foreground">{a.payoutReference}</div>}
                  {a.payoutStatus === 'ON_HOLD' && a.holdReason && <div className="mt-1 text-pretty text-xs text-danger">{a.holdReason}</div>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
