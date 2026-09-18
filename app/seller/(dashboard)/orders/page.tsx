import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { SellerOrderTable, type SellerOrderRow } from '@/components/seller/order-table';

export default async function SellerOrdersPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const allocations = await getSellerAllocations(sellerId);

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
    receivedAt: a.receivedAt ? a.receivedAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : null,
    grnNumber: a.grnNumber,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · fulfillment</div>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Incoming requisitions</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every real requisition awarded to you — filter, search, and drill into drop-off and payout detail.
      </p>

      <SellerOrderTable orders={orders} />
    </div>
  );
}
