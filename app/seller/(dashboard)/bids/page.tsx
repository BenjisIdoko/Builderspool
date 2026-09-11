import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerBids } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { withdrawBid } from '../../actions';

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'text-slate',
  PARTIALLY_FILLED: 'text-accent',
  FILLED: 'text-accent',
  REJECTED: 'text-muted',
  WITHDRAWN: 'text-muted',
};

export default async function SellerBidsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const bids = await getSellerBids(sellerId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-xl font-medium tracking-tight text-ink">My bids</h1>

      {bids.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          You haven&apos;t submitted any bids yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-slate">
                <th className="px-5 py-3 font-medium">Material</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Delivery</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bids.map((bid) => (
                <tr key={bid.id}>
                  <td className="px-5 py-3 text-ink">{bid.material.name}</td>
                  <td className="px-5 py-3 text-ink">{formatNaira(bid.unitPrice)}</td>
                  <td className="px-5 py-3 text-ink">
                    {bid.quantityOffered} {bid.material.unit}
                  </td>
                  <td className="px-5 py-3 text-ink">{bid.estimatedDeliveryDays}d</td>
                  <td className={`px-5 py-3 ${STATUS_STYLES[bid.status] ?? 'text-ink'}`}>
                    {bid.status.replace('_', ' ').toLowerCase()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {bid.status === 'SUBMITTED' && (
                      <form action={withdrawBid}>
                        <input type="hidden" name="bidId" value={bid.id} />
                        <input type="hidden" name="sellerId" value={sellerId} />
                        <button type="submit" className="text-sm text-muted hover:text-ink">
                          Withdraw
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
