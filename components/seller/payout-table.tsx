'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration, NoResultsIllustration } from '@/components/empty-state/illustrations';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterDropdown, FilterDropdownLabel, FilterCheckboxRow } from '@/components/ui/filter-dropdown';
import { pillClass, payoutStatusTone } from '@/lib/statusColors';
import { formatNaira } from '@/lib/format';
import type { PayoutStatus } from '@prisma/client';
import { PAYOUT_LABEL } from '@/lib/labels';

const SOURCE_LABEL = { POOL: 'Pool bid', DIRECT: 'Buy Direct', RFQ: 'RFQ' } as const;

export interface PayoutRow {
  id: string;
  source: keyof typeof SOURCE_LABEL;
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
    <div className="overflow-hidden rounded-lg bg-card-alt">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-label text-muted-foreground uppercase">Payout history</h2>
        {payouts.length > 0 && (
          <FilterDropdown>
            <FilterDropdownLabel>Status</FilterDropdownLabel>
            <div className="flex flex-col gap-1">
              {STATUS_OPTIONS.map((s) => (
                <FilterCheckboxRow key={s} checked={statusFilter[s] !== false} onChange={() => setStatusFilter((prev) => ({ ...prev, [s]: prev[s] === false }))}>
                  {PAYOUT_LABEL[s]}
                </FilterCheckboxRow>
              ))}
            </div>
          </FilterDropdown>
        )}
      </div>

      {payouts.length === 0 ? (
        <EmptyState
          illustration={EmptyListIllustration}
          variant="inline"
          as="p"
          title="No payouts yet"
          description="Orders you win show up here, then move to Paid once the goods are received."
        />
      ) : filtered.length === 0 ? (
        <EmptyState illustration={NoResultsIllustration} variant="inline" as="p" title="No payouts match this filter" description="Try a different status." />
      ) : (
        <>
          <ul className="divide-y divide-border md:hidden">
            {filtered.map((p) => (
              <li key={p.id} className="space-y-1 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 text-pretty font-bold text-ink">{p.materialName}</span>
                  <span className="shrink-0 font-mono font-medium tabular-nums text-ink">{formatNaira(p.amount)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge variant="outline" className={pillClass(payoutStatusTone(p.status))}>
                    {PAYOUT_LABEL[p.status]}
                  </Badge>
                  <span className="text-caption text-muted-foreground">{SOURCE_LABEL[p.source]}</span>
                </div>
                <div className="text-caption tabular-nums text-muted-foreground">
                  {p.date ?? 'Not paid yet'}
                  {p.reference && <span className="font-mono"> · Ref {p.reference}</span>}
                </div>
              </li>
            ))}
          </ul>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Paid on</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-3 text-ink">
                    <div className="text-pretty">{p.materialName}</div>
                    <div className="text-caption text-muted-foreground">{SOURCE_LABEL[p.source]}</div>
                  </TableCell>
                  <TableCell className="py-3 tabular-nums text-muted-foreground">{p.date ?? '—'}</TableCell>
                  <TableCell className="py-3 text-right font-semibold tabular-nums text-ink">{formatNaira(p.amount)}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={pillClass(payoutStatusTone(p.status))}>
                      {PAYOUT_LABEL[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-muted-foreground">{p.reference ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
