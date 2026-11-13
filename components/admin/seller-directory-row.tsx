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
import { regionLabel } from '@/lib/queries/pickupCenters';

export function SellerDirectoryRow({ entry }: { entry: SellerDirectoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TableRow>
      <TableCell className="py-3 text-ink">
        <div className="max-w-48 truncate font-medium">{entry.name}</div>
        <div className="text-xs text-muted-foreground">{entry.category ?? 'No category yet'}</div>
        {expanded && (
          <div className="mt-1.5 flex flex-col gap-0.5 text-caption text-slate">
            <span>
              <span className="font-semibold">Email:</span> {entry.email}
            </span>
            <span>
              <span className="font-semibold">Regions served:</span>{' '}
              {entry.regionsServed.length > 0 ? entry.regionsServed.map(regionLabel).join(', ') : '—'}
            </span>
            <span>
              <span className="font-semibold">Delivered of awarded:</span>{' '}
              {entry.fulfillmentPct === null ? 'Nothing awarded yet' : `${entry.fulfillmentPct.toFixed(0)}%`}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell className="py-3 text-slate">
        {entry.location ?? (entry.regionsServed.length > 0 ? entry.regionsServed.map(regionLabel).join(', ') : '—')}
      </TableCell>
      <TableCell className="py-3 text-right font-mono font-medium tabular-nums text-ink"><Money amount={entry.gmvMtd} /></TableCell>
      <TableCell className="py-3">
        <Badge variant="outline" className={pillClass(kycStatusTone(entry.kycStatus))}>
          {KYC_LABEL[entry.kycStatus] ?? entry.kycStatus}
        </Badge>
      </TableCell>
      <TableCell className="py-3 text-right whitespace-nowrap">
        {entry.kycStatus === 'PENDING' && (
          <ActionForm
            action={approveKycAction}
            className="mr-1.5 inline-block"
            confirm={{
              title: `Approve ${entry.name}?`,
              description: 'They can bid and list products straight away. The decision is recorded in the audit log.',
              confirmLabel: 'Approve seller',
            }}
          >
            <input type="hidden" name="userId" value={entry.id} />
            <Button type="submit" size="sm">
              Approve
            </Button>
          </ActionForm>
        )}
        <Button type="button" variant="outline" size="sm" aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} details for ${entry.name}`} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide' : 'Details'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
