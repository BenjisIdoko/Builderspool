import Link from 'next/link';
import {
  CaretDownIcon,
  CaretUpIcon,
  CaretUpDownIcon,
  ChartLineUpIcon,
  ClockIcon,
  CurrencyNgnIcon,
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  ReceiptIcon,
  SealCheckIcon,
} from '@phosphor-icons/react/ssr';
import { OrderStatus } from '@prisma/client';
import {
  getOrdersForAdmin,
  getOrderStatusCounts,
  getOrderQuickStats,
  ORDER_SORT_FIELDS,
  type OrderSortField,
  type SortDir,
} from '@/lib/queries/adminOrders';
import { formatNaira } from '@/lib/format';
import { orderStatusTone, fulfillmentStageTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { OrderRowActions } from '@/components/admin/order-row-actions';
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

// A short, readable stand-in for the real cuid — same idea as a "#390561"
// order number in the reference, but honestly derived from the real id
// (its own last 6 characters) rather than a separate invented numbering
// scheme. The full real id is still the link target and shows on hover.
function shortOrderNumber(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; sort?: string; dir?: string }>;
}) {
  const { status, q, page: pageParam, sort: sortParam, dir: dirParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const validStatus = status && status in OrderStatus ? (status as OrderStatus) : undefined;
  const sort: OrderSortField = ORDER_SORT_FIELDS.includes(sortParam as OrderSortField)
    ? (sortParam as OrderSortField)
    : 'date';
  const dir: SortDir = dirParam === 'asc' ? 'asc' : 'desc';

  const [{ orders, total, pageCount }, counts, quickStats] = await Promise.all([
    getOrdersForAdmin({ status: validStatus, query: q, page, sort, dir }),
    getOrderStatusCounts(),
    getOrderQuickStats(),
  ]);

  const kpiCards = [
    { label: 'Total orders', value: String(counts.total), icon: ReceiptIcon, tone: 'info' as const, chip: 'All-time' },
    {
      label: 'Awaiting payment',
      value: String(counts.pending),
      icon: ClockIcon,
      tone: counts.pending > 0 ? ('warning' as const) : ('success' as const),
      chip: counts.pending > 0 ? 'Needs follow-up' : 'All clear',
    },
    { label: 'Paid', value: String(counts.paid), icon: SealCheckIcon, tone: 'success' as const, chip: 'Confirmed revenue' },
    { label: 'Revenue', value: formatNaira(quickStats.revenue), icon: CurrencyNgnIcon, tone: 'info' as const, chip: 'From paid orders' },
    {
      label: 'Avg order value',
      value: formatNaira(quickStats.avgOrderValue),
      icon: ChartLineUpIcon,
      tone: 'info' as const,
      chip: `Across ${quickStats.paidCount} paid`,
    },
  ];

  function urlFor(overrides: { status?: string; q?: string; page?: number; sort?: OrderSortField; dir?: SortDir }) {
    const params = new URLSearchParams();
    const s = overrides.status !== undefined ? overrides.status : status;
    const query = overrides.q !== undefined ? overrides.q : q;
    const p = overrides.page ?? 1;
    const sortField = overrides.sort ?? sort;
    const sortDir = overrides.dir ?? dir;
    if (s) params.set('status', s);
    if (query) params.set('q', query);
    if (p > 1) params.set('page', String(p));
    if (sortField !== 'date') params.set('sort', sortField);
    if (sortDir !== 'desc') params.set('dir', sortDir);
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  function sortUrlFor(field: OrderSortField) {
    const nextDir: SortDir = sort === field && dir === 'desc' ? 'asc' : 'desc';
    return urlFor({ sort: field, dir: nextDir, page: 1 });
  }

  function sortableHead(field: OrderSortField, label: string) {
    const active = sort === field;
    return (
      <TableHead key={field}>
        <Link href={sortUrlFor(field)} className="inline-flex items-center gap-1 hover:text-ink">
          {label}
          {active ? (
            dir === 'asc' ? (
              <CaretUpIcon className="size-3" />
            ) : (
              <CaretDownIcon className="size-3" />
            )
          ) : (
            <CaretUpDownIcon className="size-3 text-muted-foreground/60" />
          )}
        </Link>
      </TableHead>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Orders</h1>
          <p className="text-sm text-muted-foreground">Every real checkout, across every buyer.</p>
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

      <h2 className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">Quick stats</h2>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="overflow-hidden rounded-lg border border-border bg-surface p-4">
            <div className={`mb-3 flex size-8 items-center justify-center rounded-lg ${pillClass(kpi.tone)}`}>
              <kpi.icon className="size-4" />
            </div>
            <div className="mb-1 text-[11px] text-muted-foreground">{kpi.label}</div>
            <div className="mb-2 truncate text-lg font-semibold text-ink">{kpi.value}</div>
            <Badge variant="outline" className={pillClass(kpi.tone)}>
              {kpi.chip}
            </Badge>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">
        All orders · {total} matching
      </h2>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => {
            const active = validStatus === f.value;
            return (
              <Link key={f.label} href={urlFor({ status: f.value ?? '', page: 1 })}>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
                  }`}
                >
                  {f.label} ({counts[f.countKey]})
                </span>
              </Link>
            );
          })}
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
                {sortableHead('id', 'Order')}
                {sortableHead('buyer', 'Buyer')}
                {sortableHead('items', 'Items')}
                {sortableHead('total', 'Total')}
                {sortableHead('status', 'Payment')}
                {sortableHead('stage', 'Fulfillment')}
                {sortableHead('date', 'Date')}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const buyerName = order.buyer.businessName ?? order.buyer.name;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="py-3 font-semibold text-ink" title={order.id}>
                      {shortOrderNumber(order.id)}
                    </TableCell>
                    <TableCell className="py-3 text-ink">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.buyer.name} className="size-8 shrink-0 text-[10px]" />
                        <div className="min-w-0">
                          <div className="max-w-40 truncate font-medium">{buyerName}</div>
                          <div className="max-w-40 truncate text-xs text-muted-foreground">{order.buyer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-ink">{order.items.length}</TableCell>
                    <TableCell className="py-3 font-semibold text-ink">{formatNaira(order.total)}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={pillClass(orderStatusTone(order.status))}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`w-fit max-w-36 truncate ${pillClass(fulfillmentStageTone(order.fulfillmentStage))}`}>
                        {order.fulfillmentStage}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      <div>{order.createdAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })}</div>
                      <div className="text-xs">{order.createdAt.toLocaleTimeString('en-NG', { timeStyle: 'short' })}</div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <OrderRowActions orderId={order.id} />
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
            Showing page {page} of {pageCount}
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
