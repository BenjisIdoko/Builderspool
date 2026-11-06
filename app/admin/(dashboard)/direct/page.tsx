import { getAdminDirectLines } from '@/lib/queries/adminDirect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { disburseDirectPayoutAction, issueDirectGrnAction } from './actions';

export const metadata = { title: 'Buy Direct orders' };

const STATUS = {
  AWAITING_ACCEPT: { label: 'Waiting for seller', variant: 'warning' },
  ACCEPTED: { label: 'Accepted: awaiting goods', variant: 'pool' },
  FULFILLED: { label: 'Received', variant: 'success' },
  DECLINED: { label: 'Declined: refunded', variant: 'danger' },
  EXPIRED: { label: 'Not accepted: refunded', variant: 'danger' },
} as const;

export default async function AdminDirectPage() {
  const lines = await getAdminDirectLines();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · logistics &amp; settlement</div>
      <h1 className="mb-1 text-heading-lg text-ink">Buy Direct orders</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Lines the buyer bought straight from a seller. The seller accepts, sends the goods to the fulfilment centre, and you issue
        the goods received note once the centre has received and checked them. That makes the seller&rsquo;s payment due, less the
        Buy Direct commission. A line the seller declines or does not accept in time is refunded to the buyer automatically.
      </p>

      <section className="rounded-card bg-card-alt p-5">
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Buy Direct orders yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-ink">
                    {l.material} <span className="text-slate">× {l.quantity.toLocaleString('en-NG')} {l.unit}</span>
                    {l.center && <div className="text-caption text-slate">{l.center}</div>}
                  </TableCell>
                  <TableCell>{l.seller}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <Money amount={l.amount} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS[l.status].variant}>{STATUS[l.status].label}</Badge>
                    {l.grnNumber && <div className="mt-1 font-mono text-caption text-slate">{l.grnNumber}</div>}
                  </TableCell>
                  <TableCell>
                    {l.status === 'ACCEPTED' && (
                      <form action={issueDirectGrnAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <Button type="submit" size="sm">Issue GRN</Button>
                      </form>
                    )}
                    {l.status === 'FULFILLED' && l.payoutStatus === 'PROCESSED' && (
                      <form action={disburseDirectPayoutAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <Button type="submit" size="sm" variant="outline">Pay seller</Button>
                      </form>
                    )}
                    {l.payoutStatus === 'PAID' && <span className="font-mono text-caption text-slate">{l.payoutReference}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
