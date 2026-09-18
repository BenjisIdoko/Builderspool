'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterDropdown, FilterDropdownLabel, FilterCheckboxRow } from '@/components/ui/filter-dropdown';
import { pillClass, payoutStatusTone } from '@/lib/statusColors';
import { formatNaira } from '@/lib/format';
import type { PayoutStatus } from '@prisma/client';

const PAYOUT_LABEL: Record<string, string> = {
  PENDING_GRN: 'Pending GRN',
  PROCESSED: 'Processing',
  PAID: 'Paid',
  ON_HOLD: 'On hold',
};

export interface PayoutRow {
  id: string;
  materialName: string;
  amount: number;
  status: PayoutStatus;
  reference: string | null;
  date: string | null;
}

const STATUS_OPTIONS: PayoutStatus[] = ['PAID', 'PROCESSED', 'PENDING_GRN', 'ON_HOLD'];

export function PayoutTable({ payouts }: { payouts: PayoutRow[] }) {
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({});

  const filtered = payouts.filter((p) => statusFilter[p.status] !== false);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">Payout history</h2>
        <FilterDropdown>
          <FilterDropdownLabel>Status</FilterDropdownLabel>
          <div className="flex flex-col gap-1">
            {STATUS_OPTIONS.map((s) => (
              <FilterCheckboxRow
                key={s}
                checked={statusFilter[s] !== false}
                onChange={() => setStatusFilter((prev) => ({ ...prev, [s]: prev[s] === false }))}
              >
                {PAYOUT_LABEL[s]}
              </FilterCheckboxRow>
            ))}
          </div>
        </FilterDropdown>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-muted-foreground">No payouts match this filter.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="py-3 text-ink">{p.materialName}</TableCell>
                <TableCell className="py-3 text-muted-foreground">{p.date ?? '—'}</TableCell>
                <TableCell className="py-3 text-right font-semibold tabular-nums text-ink">
                  {formatNaira(p.amount)}
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className={pillClass(payoutStatusTone(p.status))}>
                    {PAYOUT_LABEL[p.status]}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground">{p.reference ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
