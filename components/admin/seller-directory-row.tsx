'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { pillClass, kycStatusTone } from '@/lib/statusColors';
import { Money } from '@/components/money';
import { approveKycAction } from '@/app/admin/(dashboard)/users/actions';
import type { SellerDirectoryEntry } from '@/lib/queries/adminSellers';
import { KYC_LABEL_OPS as KYC_LABEL } from '@/lib/labels';
import { ActionForm } from '@/components/ui/action-form';

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
      <TableCell className="py-3 text-right font-mono font-medium tabular-nums text-ink"><Money amount={entry.gmvMtd} /></TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className={pillClass(kycStatusTone(entry.kycStatus))}>
          {KYC_LABEL[entry.kycStatus] ?? entry.kycStatus}
        </Badge>
      </TableCell>
      <TableCell className="py-3 text-right whitespace-nowrap">
        {entry.kycStatus === 'PENDING' && (
          <ActionForm action={approveKycAction} className="mr-1.5 inline-block">
            <input type="hidden" name="userId" value={entry.id} />
            <Button type="submit" size="sm" className="h-7 px-3 text-xs">
              Approve
            </Button>
          </ActionForm>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="h-7 rounded-md border border-border-strong bg-surface px-3 text-xs font-bold text-ink hover:bg-well"
        >
          {expanded ? 'Hide' : 'View'}
        </button>
      </TableCell>
    </TableRow>
  );
}
