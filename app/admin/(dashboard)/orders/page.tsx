import Link from 'next/link';
import { DownloadSimpleIcon, MagnifyingGlassIcon, ReceiptIcon } from '@phosphor-icons/react/ssr';
import { OrderStatus } from '@prisma/client';
import { getOrdersForAdmin, getOrderStatusCounts } from '@/lib/queries/adminOrders';
import { formatNaira } from '@/lib/format';
import { orderStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STATUS_FILTERS = [
  { value: undefined, label: 'All', countKey: 'total' as const },
  { value: OrderStatus.PENDING_PAYMENT, label: 'Awaiting payment', countKey: 'pending' as const },
  { value: OrderStatus.PAID, label: 'Paid', countKey: 'paid' as const },
  { value: OrderStatus.CANCELLED, label: 'Cancelled', countKey: 'cancelled' as const },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const validStatus = status && status in OrderStatus ? (status as OrderStatus) : undefined;

  const [{ orders, total, pageCount }, counts] = await Promise.all([
    getOrdersForAdmin({ status: validStatus, query: q, page }),
    getOrderStatusCounts(),
  ]);

  function urlFor(overrides: { status?: string; q?: string; page?: number }) {
    const params = new URLSearchParams();
    const s = overrides.status !== undefined ? overrides.status : status;
    const query = overrides.q !== undefined ? overrides.q : q;
    const p = overrides.page ?? 1;
    if (s) params.set('status', s);
    if (query) params.set('q', query);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Every real checkout, across every buyer — {total} matching {total === 1 ? 'order' : 'orders'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <a href={`/api/admin/orders/export?format=csv${validStatus ? `&status=${validStatus}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
              <DownloadSimpleIcon className="size-4" />
              CSV
            </a>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href={`/api/admin/orders/export?format=json${validStatus ? `&status=${validStatus}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
              <DownloadSimpleIcon className="size-4" />
              JSON
            </a>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Link key={f.label} href={urlFor({ status: f.value ?? '', page: 1 })}>
              <Badge
                variant="outline"
                className={
                  validStatus === f.value ? 'border-brand bg-info-soft text-info' : 'border-border text-slate'
                }
              >
                {f.label} ({counts[f.countKey]})
              </Badge>
            </Link>
          ))}
        </div>

        <form className="flex max-w-xs flex-1 items-center gap-2">
          {validStatus && <input type="hidden" name="status" value={validStatus} />}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search order ID or buyer…" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <ReceiptIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {q
              ? `No orders match "${q}".`
              : validStatus
                ? `No ${(STATUS_LABEL[validStatus] ?? validStatus).toLowerCase()} orders right now.`
                : 'No orders yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const buyerName = order.buyer.businessName ?? order.buyer.name;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="max-w-32 truncate text-muted-foreground">{order.id}</TableCell>
                    <TableCell className="text-ink">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.buyer.name} className="size-8 shrink-0 text-[10px]" />
                        <div className="min-w-0">
                          <div className="max-w-40 truncate font-medium">{buyerName}</div>
                          <div className="max-w-40 truncate text-xs text-muted-foreground">{order.buyer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink">{order.items.length}</TableCell>
                    <TableCell className="text-ink">{formatNaira(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-36 truncate text-ink">{order.fulfillmentStage}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.createdAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm text-brand hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page - 1 })}>Previous</Link>
              </Button>
            )}
            {page >= pageCount ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={urlFor({ page: page + 1 })}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
