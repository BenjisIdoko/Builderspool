'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import type { AllocationStatus } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterDropdown, FilterDropdownLabel, FilterCheckboxRow } from '@/components/ui/filter-dropdown';
import { SellerOrderTableRow } from './order-table-row';
import { formatNaira } from '@/lib/format';

export interface SellerOrderRow {
  id: string;
  shortId: string;
  buyerName: string;
  materialName: string;
  quantity: number;
  unit: string;
  amount: number;
  status: AllocationStatus;
  payoutStatus: string;
  centerName: string | null;
  centerAddress: string | null;
  receivedAt: string | null;
  grnNumber: string | null;
}

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Fulfilled', 'Cancelled'] as const;

export function SellerOrderTable({ orders }: { orders: SellerOrderRow[] }) {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('All');
  const [search, setSearch] = useState('');
  const [needsActionOnly, setNeedsActionOnly] = useState(false);

  const filtered = orders.filter((o) => {
    if (status !== 'All' && o.status !== status.toUpperCase()) return false;
    if (needsActionOnly && o.receivedAt) return false;
    if (
      search.trim() &&
      !o.materialName.toLowerCase().includes(search.trim().toLowerCase()) &&
      !o.buyerName.toLowerCase().includes(search.trim().toLowerCase())
    )
      return false;
    return true;
  });

  const counts = Object.fromEntries(
    STATUS_TABS.map((tab) => [tab, tab === 'All' ? orders.length : orders.filter((o) => o.status === tab.toUpperCase()).length])
  ) as Record<(typeof STATUS_TABS)[number], number>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                status === tab ? 'bg-ink text-canvas' : 'bg-well text-slate hover:text-ink'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown>
            <FilterDropdownLabel>Show only</FilterDropdownLabel>
            <FilterCheckboxRow checked={needsActionOnly} onChange={() => setNeedsActionOnly((v) => !v)}>
              Not yet received at hub
            </FilterCheckboxRow>
          </FilterDropdown>
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search material or buyer…"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-sm text-muted-foreground">
          No requisitions match this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requisition</TableHead>
                <TableHead>Buyer &amp; material</TableHead>
                <TableHead className="text-right">Escrow amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <SellerOrderTableRow
                  key={o.id}
                  shortId={o.shortId}
                  buyerName={o.buyerName}
                  materialName={o.materialName}
                  quantity={o.quantity}
                  unit={o.unit}
                  amount={formatNaira(o.amount)}
                  status={o.status}
                  payoutStatus={o.payoutStatus}
                  centerName={o.centerName}
                  centerAddress={o.centerAddress}
                  receivedAt={o.receivedAt}
                  grnNumber={o.grnNumber}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
