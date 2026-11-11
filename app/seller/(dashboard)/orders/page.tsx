import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { getSellerDirectOrders } from '@/lib/queries/sellerDirect';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { DirectOrderActions } from '@/components/seller/direct-order-actions';
import { SellerOrderTable, type SellerOrderRow } from '@/components/seller/order-table';
import { formatLagosDateTime } from '@/lib/format';

export default async function SellerOrdersPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const [allocations, direct] = await Promise.all([getSellerAllocations(sellerId), getSellerDirectOrders(sellerId)]);

  const orders: SellerOrderRow[] = allocations.map((a) => ({
    id: a.id,
    shortId: `#${a.id.slice(-6).toUpperCase()}`,
    buyerName: a.orderItem.order.buyer.businessName ?? a.orderItem.order.buyer.name,
    materialName: a.bid.material.name,
    quantity: a.quantityFilled,
    unit: a.bid.material.unit,
    amount: Number(a.bid.unitPrice) * a.quantityFilled,
    status: a.status,
    payoutStatus: a.payoutStatus,
    centerName: a.orderItem.fulfillmentCenter?.name ?? null,
    centerAddress: a.orderItem.fulfillmentCenter?.address ?? null,
    receivedAt: a.receivedAt ? formatLagosDateTime(a.receivedAt) : null,
    grnNumber: a.grnNumber,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · fulfillment</div>
      <h1 className="mb-1 text-heading-lg text-ink">Incoming requisitions</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every real requisition awarded to you — filter, search, and drill into drop-off and payout detail.
      </p>

      {direct.length > 0 && (
        <section className="mb-8 rounded-card bg-card-alt p-5">
          <h2 className="mb-1 text-heading-md text-ink">Buy Direct orders ({direct.length})</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Buyers chose your listing. Accept within the window, then send the goods to the fulfilment centre. You are paid after it
            receives and checks them, less BuildersPool&rsquo;s commission.
          </p>
          <ul className="space-y-4">
            {direct.map((d) => (
              <li key={d.id} className="space-y-2 rounded-card bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-heading-sm text-ink">
                    {d.material} <span className="font-sans text-body-sm text-slate">× {d.quantity.toLocaleString('en-NG')} {d.unit}</span>
                  </h3>
                  <span className="font-mono text-figure tabular-nums text-ink"><Money amount={d.amount} /></span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-body-sm text-slate">
                  <span>For {d.buyer}</span>
                  <Badge variant={d.status === 'AWAITING_ACCEPT' ? 'warning' : d.status === 'DECLINED' || d.status === 'EXPIRED' ? 'danger' : 'success'}>
                    {{ AWAITING_ACCEPT: 'Needs your answer', ACCEPTED: 'Accepted', FULFILLED: 'Received', DECLINED: 'Declined', EXPIRED: 'Not accepted in time' }[d.status]}
                  </Badge>
                  {d.grnNumber && <span className="font-mono text-caption">{d.grnNumber}</span>}
                </div>
                {d.status === 'AWAITING_ACCEPT' && (
                  <>
                    <p className="text-caption text-slate">
                      Answer by {formatLagosDateTime(d.acceptDeadlineAt)}.
                    </p>
                    <DirectOrderActions id={d.id} />
                  </>
                )}
                {d.status === 'ACCEPTED' && d.centerName && (
                  <p className="text-caption text-slate">
                    Send to {d.centerName}{d.centerAddress ? `, ${d.centerAddress}` : ''}.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <SellerOrderTable orders={orders} />
    </div>
  );
}
