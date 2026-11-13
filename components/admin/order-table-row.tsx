'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        <span className="font-mono">{shortId}</span>
        <div className="text-xs font-normal tabular-nums text-muted-foreground">
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
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-slate">
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
      <TableCell className="py-3 font-semibold tabular-nums text-ink">{total}</TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className={escrowClassName}>
          {escrowLabel}
        </Badge>
      </TableCell>
      <TableCell className="py-3 text-right">
        <Button type="button" variant="outline" size="sm" aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} details for order ${shortId}`} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide' : 'Details'}
        </Button>
      </TableCell>
      <TableCell className="py-3 text-right">
        <OrderRowActions orderId={orderId} shortId={shortId} />
      </TableCell>
    </TableRow>
  );
}
