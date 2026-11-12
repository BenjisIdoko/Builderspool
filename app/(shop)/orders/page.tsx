import { requireBuyer } from '@/lib/buyer/auth';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { OrderHistoryList } from '@/components/order-history-list';

export const metadata = { title: 'Your orders' };

export default async function OrdersPage() {
  const buyer = await requireBuyer();
  const orders = await getOrdersForBuyer(buyer.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-12">
      <h1 className="mb-1 text-ink">Your orders</h1>
      <p className="mb-6 text-sm text-slate">
        <span className="tabular-nums">{orders.length}</span> {orders.length === 1 ? 'order' : 'orders'}, newest first.
      </p>
      <div className="overflow-hidden rounded-lg bg-surface">
        <OrderHistoryList orders={orders} />
      </div>
    </div>
  );
}
