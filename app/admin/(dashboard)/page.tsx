import Link from 'next/link';
import { getAllCycles } from '@/lib/queries/adminBidding';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_BADGE_CLASS: Record<string, string> = {
  OPEN: 'bg-transparent text-slate border-border',
  CLOSED: 'bg-transparent text-warning border-warning/30',
  AWARDED: 'bg-brand text-brand-ink',
};

export default async function AdminCyclesPage() {
  const cycles = await getAllCycles();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Bid cycles</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every demand cycle the bidding engine has created or resolved — one per material, per
        region (national if none), per day.
      </p>

      {cycles.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          No bid cycles yet — one is created the first time a paid order item joins a demand pool
          (see lib/bidding/joinCycle.ts).
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
              {cycles.map((cycle) => (
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
                    <Badge variant="outline" className={STATUS_BADGE_CLASS[cycle.status]}>
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
