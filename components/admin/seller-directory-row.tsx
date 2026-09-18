'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { pillClass, kycStatusTone } from '@/lib/statusColors';
import { formatNaira } from '@/lib/format';
import { approveKycAction } from '@/app/admin/(dashboard)/users/actions';
import type { SellerDirectoryEntry } from '@/lib/queries/adminSellers';

const KYC_LABEL: Record<string, string> = {
  APPROVED: 'Verified',
  PENDING: 'Pending review',
  REJECTED: 'Rejected',
  NOT_SUBMITTED: 'Not submitted',
};

export function SellerDirectoryRow({ entry }: { entry: SellerDirectoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TableRow>
      <TableCell className="py-3 text-ink">
        <div className="max-w-48 truncate font-medium">{entry.name}</div>
        <div className="text-xs text-muted-foreground">{entry.category ?? 'No fulfilled allocations yet'}</div>
        {expanded && (
          <div className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] text-slate">
            <span>
              <span className="font-semibold">Email:</span> {entry.email}
            </span>
            <span>
              <span className="font-semibold">Regions served:</span>{' '}
              {entry.regionsServed.length > 0 ? entry.regionsServed.join(', ') : '—'}
            </span>
            <span>
              <span className="font-semibold">Fulfillment rate:</span>{' '}
              {entry.fulfillmentPct === null ? 'No allocations yet' : `${entry.fulfillmentPct.toFixed(0)}%`}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 text-slate">
        {entry.location ?? (entry.regionsServed.length > 0 ? entry.regionsServed.join(', ') : '—')}
      </TableCell>
      <TableCell className="py-3 text-right font-semibold text-ink">{formatNaira(entry.gmvMtd)}</TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className={pillClass(kycStatusTone(entry.kycStatus))}>
          {KYC_LABEL[entry.kycStatus] ?? entry.kycStatus}
        </Badge>
      </TableCell>
      <TableCell className="py-3 text-right whitespace-nowrap">
        {entry.kycStatus === 'PENDING' && (
          <form action={approveKycAction} className="mr-1.5 inline-block">
            <input type="hidden" name="userId" value={entry.id} />
            <Button type="submit" size="sm" className="h-7 rounded-full px-3 text-xs">
              Approve
            </Button>
          </form>
        )}
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
