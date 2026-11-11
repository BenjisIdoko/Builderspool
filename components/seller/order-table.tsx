'use client';

import { EmptyState } from '@/components/empty-state/empty-state';
import { NoResultsIllustration } from '@/components/empty-state/illustrations';
import { useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import type { AllocationStatus } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterDropdown, FilterDropdownLabel, FilterCheckboxRow } from '@/components/ui/filter-dropdown';
import { SellerOrderTableRow } from './order-table-row';
import { SellerOrderCard } from './order-card';
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
        <div className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              aria-pressed={status === tab}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring transition-[background-color,color,scale] duration-150 active:scale-[0.96] lg:min-h-8 lg:px-3 ${
                status === tab ? 'bg-ink text-canvas' : 'bg-well text-slate hover:text-ink'
              }`}
            >
              {tab} (<span className="tabular-nums">{counts[tab]}</span>)
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown>
            <FilterDropdownLabel>Show only</FilterDropdownLabel>
            <FilterCheckboxRow checked={needsActionOnly} onChange={() => setNeedsActionOnly((v) => !v)}>
              Not yet received at our centre
            </FilterCheckboxRow>
          </FilterDropdown>
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search material or buyer…"
              aria-label="Search orders by material or buyer"
              autoComplete="off"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card bg-card-alt">
          <EmptyState
            illustration={NoResultsIllustration}
            variant="inline"
            as="p"
            title={orders.length === 0 ? 'No Pool & Save orders yet' : 'No orders match this filter'}
            description={orders.length === 0 ? 'Orders appear here once a pool is awarded to you.' : 'Try a different status, or clear the search.'}
          />
        </div>
      ) : (
        <>
        <div className="flex flex-col gap-2.5 md:hidden">
          {filtered.map((o) => (
            <SellerOrderCard key={o.id} order={o} amount={formatNaira(o.amount)} />
          ))}
        </div>
        <div className="hidden overflow-hidden rounded-card bg-card-alt md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer &amp; material</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
        </>
      )}
    </div>
  );
}
