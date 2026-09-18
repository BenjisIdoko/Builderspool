'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilterDropdown, FilterDropdownLabel, FilterCheckboxRow } from '@/components/ui/filter-dropdown';
import { SellerDirectoryRow } from './seller-directory-row';
import type { SellerDirectoryEntry } from '@/lib/queries/adminSellers';

const STATUS_TABS = ['All', 'Verified', 'Pending review'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export function SellerDirectoryTable({ sellers }: { sellers: SellerDirectoryEntry[] }) {
  const [status, setStatus] = useState<StatusTab>('All');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () => [...new Set(sellers.map((s) => s.category).filter((c): c is string => c !== null))].sort(),
    [sellers]
  );

  const filtered = sellers.filter((s) => {
    if (status === 'Verified' && s.kycStatus !== 'APPROVED') return false;
    if (status === 'Pending review' && s.kycStatus !== 'PENDING') return false;
    if (search.trim() && !s.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (s.category && categoryFilter[s.category] === false) return false;
    return true;
  });

  const counts = {
    All: sellers.length,
    Verified: sellers.filter((s) => s.kycStatus === 'APPROVED').length,
    'Pending review': sellers.filter((s) => s.kycStatus === 'PENDING').length,
  };

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
                status === tab ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.length > 0 && (
            <FilterDropdown>
              <FilterDropdownLabel>Category</FilterDropdownLabel>
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <FilterCheckboxRow
                    key={cat}
                    checked={categoryFilter[cat] !== false}
                    onChange={() => setCategoryFilter((s) => ({ ...s, [cat]: s[cat] === false }))}
                  >
                    {cat}
                  </FilterCheckboxRow>
                ))}
              </div>
            </FilterDropdown>
          )}
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search seller name…"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center text-sm text-muted-foreground">
          No sellers match this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead className="text-right">GMV (MTD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <SellerDirectoryRow key={s.id} entry={s} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
