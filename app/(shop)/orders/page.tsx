import { requireBuyer } from '@/lib/buyer/auth';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { AccountShell, ACCOUNT_CARD } from '@/components/account-shell';
import { OrderHistoryList } from '@/components/order-history-list';

export const metadata = { title: 'Your orders' };

export default async function OrdersPage() {
  const buyer = await requireBuyer();
  const orders = await getOrdersForBuyer(buyer.id);

  return (
    <AccountShell>
      <h1 className="mb-1 text-ink">Orders</h1>
      <p className="mb-6 text-sm text-slate">
        <span className="tabular-nums">{orders.length}</span> {orders.length === 1 ? 'order' : 'orders'}, newest first.
      </p>
      <div className={ACCOUNT_CARD}>
        <OrderHistoryList orders={orders} />
      </div>
    </AccountShell>
  );
}
