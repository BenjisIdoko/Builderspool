'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import type { AdminCycleSummary } from '@/lib/queries/adminBidding';
import { cycleStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CyclesTable({ cycles }: { cycles: AdminCycleSummary[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? cycles.filter((cycle) => {
        const haystack = `${cycle.material.name} ${cycle.material.category} ${cycle.region ?? 'National'}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : cycles;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Bid cycles</h2>
          <p className="text-sm text-muted-foreground">
            Every demand cycle the bidding engine has created or resolved — one per material, per
            region (national if none), per day.
          </p>
        </div>
        <div className="relative w-full shrink-0 sm:w-64">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by material or region"
            className="pl-9"
          />
        </div>
      </div>

      {cycles.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          No bid cycles yet — one is created the first time a paid order item joins a demand pool
          (see lib/bidding/joinCycle.ts).
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          No bid cycles match &quot;{query}&quot;.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="text-ink">
                    {cycle.material.name}
                    <span className="ml-1.5 text-xs text-muted-foreground">{cycle.material.category}</span>
                  </TableCell>
                  <TableCell className="text-ink">{cycle.region ?? 'National'}</TableCell>
                  <TableCell className="text-ink">
                    {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="text-ink">
                    {cycle.totalQuantityRequested} {cycle.material.unit}
                  </TableCell>
                  <TableCell className="text-ink">{cycle.bidCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={pillClass(cycleStatusTone(cycle.status))}>
                      {cycle.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/cycles/${cycle.id}`} className="text-sm text-brand hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
