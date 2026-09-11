import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerBids } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { withdrawBid } from '../../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_BADGE_CLASS: Record<string, string> = {
  SUBMITTED: 'bg-transparent text-slate border-border',
  PARTIALLY_FILLED: 'bg-transparent text-brand border-brand/30',
  FILLED: 'bg-brand text-brand-ink',
  REJECTED: 'bg-transparent text-muted-foreground border-border',
  WITHDRAWN: 'bg-transparent text-muted-foreground border-border',
};

export default async function SellerBidsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const bids = await getSellerBids(sellerId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-xl font-bold tracking-tight text-ink">My bids</h1>

      {bids.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          You haven&apos;t submitted any bids yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell className="text-ink">{bid.material.name}</TableCell>
                  <TableCell className="text-ink">{formatNaira(bid.unitPrice)}</TableCell>
                  <TableCell className="text-ink">
                    {bid.quantityOffered} {bid.material.unit}
                  </TableCell>
                  <TableCell className="text-ink">{bid.estimatedDeliveryDays}d</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE_CLASS[bid.status]}>
                      {bid.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {bid.status === 'SUBMITTED' && (
                      <form action={withdrawBid}>
                        <input type="hidden" name="bidId" value={bid.id} />
                        <input type="hidden" name="sellerId" value={sellerId} />
                        <Button type="submit" variant="ghost" size="sm">
                          Withdraw
                        </Button>
                      </form>
                    )}
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
