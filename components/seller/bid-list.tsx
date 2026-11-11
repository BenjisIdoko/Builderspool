import { ClockIcon, StackIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { Money } from '@/components/money';
import { MaterialImage } from '@/components/material-image';
import { WithdrawBidButton } from '@/components/seller/withdraw-bid-button';
import { Badge } from '@/components/ui/badge';
import { bidStatusTone, pillClass } from '@/lib/statusColors';
import { formatLagosDateTime, formatNaira } from '@/lib/format';
import type { getSellerBids } from '@/lib/queries/sellerPortal';

type SellerBid = Awaited<ReturnType<typeof getSellerBids>>[number];

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Open',
  PARTIALLY_FILLED: 'Partly awarded',
  FILLED: 'Awarded',
  REJECTED: 'Not awarded',
  WITHDRAWN: 'Withdrawn',
};

export function SellerBidList({ bids }: { bids: SellerBid[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg bg-card-alt">
      {bids.map((bid) => (
        <li key={bid.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
          <MaterialImage
            imageUrl={bid.material.imageUrl}
            category={bid.material.category}
            alt={bid.material.name}
            className="size-12 shrink-0 rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            sizes="48px"
          />

          <div className="min-w-0 flex-1 basis-56">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-pretty font-bold text-ink">{bid.material.name}</span>
              <Badge variant="outline" className={pillClass(bidStatusTone(bid.status))}>
                {STATUS_LABEL[bid.status] ?? bid.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <StackIcon className="size-3.5" />
                {bid.quantityOffered.toLocaleString('en-NG')} {bid.material.unit}
              </span>
              <span className="flex items-center gap-1.5">
                <TruckIcon className="size-3.5" />
                {bid.estimatedDeliveryDays}-day delivery
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5" />
                {formatLagosDateTime(bid.submittedAt)}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <div className="font-mono font-medium tabular-nums text-ink">
                <Money amount={bid.unitPrice} />
              </div>
              <div className="text-caption text-slate">per {bid.material.unit}</div>
            </div>
            {bid.status === 'SUBMITTED' && (
              <WithdrawBidButton bidId={bid.id} material={bid.material.name} price={`${formatNaira(Number(bid.unitPrice))} per ${bid.material.unit}`} />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
