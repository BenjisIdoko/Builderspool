'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { pillClass, allocationStatusTone } from '@/lib/statusColors';
import { STATUS_LABEL, PAYOUT_LABEL } from './order-table-row';
import type { SellerOrderRow } from './order-table';

// Phone-sized version of a requisition row (SellerMobileApp handoff): a tappable
// card that opens the same detail the desktop "View" toggle reveals, in a
// bottom sheet. Real data only — there's no accept/dispatch step to swipe on.
export function SellerOrderCard({ order, amount }: { order: SellerOrderRow; amount: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-[14px] border border-border bg-surface p-3.5 text-left"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[13.5px] font-bold text-ink">{order.shortId}</span>
          <Badge variant="outline" className={pillClass(allocationStatusTone(order.status))}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Badge>
        </div>
        <div className="truncate text-xs text-slate">{order.buyerName}</div>
        <div className="mb-1.5 truncate text-xs text-muted-foreground">
          {order.materialName} · {order.quantity} {order.unit}
        </div>
        <div className="text-[13px] font-extrabold tabular-nums text-ink">{amount}</div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[80svh] overflow-y-auto rounded-t-[22px] px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] md:hidden"
        >
          <SheetTitle className="text-lg font-bold text-ink">{order.shortId}</SheetTitle>
          <SheetDescription>
            {order.buyerName} · {order.materialName} · {order.quantity} {order.unit}
          </SheetDescription>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Escrow amount</dt>
              <dd className="font-bold tabular-nums text-ink">{amount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-bold text-ink">{STATUS_LABEL[order.status] ?? order.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Drop-off</dt>
              <dd className="text-right font-semibold text-ink">
                {order.centerName ?? 'No fulfillment center on record'}
                {order.centerAddress ? ` — ${order.centerAddress}` : ''}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Received</dt>
              <dd className="text-right font-semibold text-ink">
                {order.receivedAt
                  ? `${order.receivedAt}${order.grnNumber ? ` (${order.grnNumber})` : ''}`
                  : 'Not yet received'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Payout</dt>
              <dd className="font-semibold text-ink">{PAYOUT_LABEL[order.payoutStatus] ?? order.payoutStatus}</dd>
            </div>
          </dl>
        </SheetContent>
      </Sheet>
    </>
  );
}
