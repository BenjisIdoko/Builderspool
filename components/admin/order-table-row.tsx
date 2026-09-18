'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/avatar';
import { TableCell, TableRow } from '@/components/ui/table';
import { OrderRowActions } from './order-row-actions';

// Lean row: primary columns always visible, secondary real fields (items
// count, payment status, fulfillment stage) revealed on demand instead of
// occupying their own always-visible columns — same information, denser
// default view.
export function OrderTableRow({
  orderId,
  shortId,
  date,
  time,
  buyerName,
  buyerEmail,
  total,
  itemCount,
  escrowLabel,
  escrowClassName,
  paymentLabel,
  paymentClassName,
  fulfillmentStage,
  fulfillmentClassName,
}: {
  orderId: string;
  shortId: string;
  date: string;
  time: string;
  buyerName: string;
  buyerEmail: string;
  total: string;
  itemCount: number;
  escrowLabel: string;
  escrowClassName: string;
  paymentLabel: string;
  paymentClassName: string;
  fulfillmentStage: string;
  fulfillmentClassName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TableRow>
      <TableCell className="py-3 font-semibold text-ink" title={orderId}>
        {shortId}
        <div className="text-xs font-normal text-muted-foreground">
          {date} · {time}
        </div>
      </TableCell>
      <TableCell className="py-3 text-ink">
        <div className="flex items-center gap-2.5">
          <Avatar name={buyerName} className="size-8 shrink-0 text-[10px]" />
          <div className="min-w-0">
            <div className="max-w-40 truncate font-medium">{buyerName}</div>
            <div className="max-w-40 truncate text-xs text-muted-foreground">{buyerEmail}</div>
            {expanded && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-slate">
                <span>{itemCount} item{itemCount === 1 ? '' : 's'}</span>
                <span>·</span>
                <Badge variant="outline" className={paymentClassName}>
                  {paymentLabel}
                </Badge>
                <Badge variant="outline" className={`max-w-32 truncate ${fulfillmentClassName}`}>
                  {fulfillmentStage}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3 font-semibold text-ink">{total}</TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className={escrowClassName}>
          {escrowLabel}
        </Badge>
      </TableCell>
      <TableCell className="py-3 text-right">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="h-7 rounded-full border border-border-strong bg-surface px-3 text-xs font-bold text-ink hover:bg-well"
        >
          {expanded ? 'Hide' : 'View'}
        </button>
      </TableCell>
      <TableCell className="py-3 text-right">
        <OrderRowActions orderId={orderId} />
      </TableCell>
    </TableRow>
  );
}
