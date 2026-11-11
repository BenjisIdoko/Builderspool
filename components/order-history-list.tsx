import Link from 'next/link';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLagosDateTime, formatNaira } from '@/lib/format';
import { orderStatusTone, pillClass } from '@/lib/statusColors';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export type OrderHistoryRow = { id: string; status: string; createdAt: Date; itemCount: number; total: number };

// A buyer's orders, newest first: a row per order, each opening that order. Used on the account page
// and on /orders.
export function OrderHistoryList({ orders }: { orders: OrderHistoryRow[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        illustration={EmptyListIllustration}
        variant="inline"
        title="No orders yet"
        description="Your orders will show up here once you place your first one."
      >
        <Button asChild variant="outline">
          <Link href="/catalog">Browse materials</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="flex min-h-16 items-center justify-between gap-4 px-5 py-4 outline-none transition-colors duration-150 hover:bg-well focus-visible:bg-well focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium text-ink" title={order.id}>
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                <Badge variant="outline" className={pillClass(orderStatusTone(order.status as never))}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>
              <div className="mt-1 text-sm tabular-nums text-muted-foreground">
                {formatLagosDateTime(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
              </div>
            </div>
            <div className="shrink-0 font-bold tabular-nums text-ink">{formatNaira(order.total)}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
