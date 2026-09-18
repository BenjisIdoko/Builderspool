'use client';

import { useState } from 'react';
import type { AllocationStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { pillClass, allocationStatusTone } from '@/lib/statusColors';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
};

const PAYOUT_LABEL: Record<string, string> = {
  PENDING_GRN: 'Payout pending GRN',
  PROCESSED: 'Payout cleared',
  PAID: 'Payout sent',
  ON_HOLD: 'Payout on hold',
};

export function SellerOrderTableRow({
  shortId,
  buyerName,
  materialName,
  quantity,
  unit,
  amount,
  status,
  payoutStatus,
  centerName,
  centerAddress,
  receivedAt,
  grnNumber,
}: {
  shortId: string;
  buyerName: string;
  materialName: string;
  quantity: number;
  unit: string;
  amount: string;
  status: AllocationStatus;
  payoutStatus: string;
  centerName: string | null;
  centerAddress: string | null;
  receivedAt: string | null;
  grnNumber: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TableRow>
      <TableCell className="py-3 font-semibold text-ink">{shortId}</TableCell>
      <TableCell className="py-3 text-ink">
        <div className="max-w-48 truncate font-semibold">{buyerName}</div>
        <div className="max-w-48 truncate text-xs text-muted-foreground">
          {materialName} · {quantity} {unit}
        </div>
        {expanded && (
          <div className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] text-slate">
            <span>
              <span className="font-semibold">Drop-off:</span> {centerName ?? 'No fulfillment center on record'}
              {centerAddress ? ` — ${centerAddress}` : ''}
            </span>
            <span>
              <span className="font-semibold">Received:</span>{' '}
              {receivedAt ? `${receivedAt}${grnNumber ? ` (${grnNumber})` : ''}` : 'Not yet received'}
            </span>
            <span>
              <span className="font-semibold">Payout:</span> {PAYOUT_LABEL[payoutStatus] ?? payoutStatus}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 text-right font-semibold tabular-nums text-ink">{amount}</TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className={pillClass(allocationStatusTone(status))}>
          {STATUS_LABEL[status] ?? status}
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
    </TableRow>
  );
}
