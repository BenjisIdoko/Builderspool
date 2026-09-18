import { prisma } from '../prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { ORDER_DETAIL_INCLUDE, toPlainOrder, getOrderTrackingStages } from './orders';
import { getEscrowStatus } from './escrow';
import { getOrderTotal } from '../checkout/orderTotal';

const PAGE_SIZE = 10;

export const ORDER_SORT_FIELDS = ['id', 'buyer', 'items', 'total', 'status', 'stage', 'date'] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];
export type SortDir = 'asc' | 'desc';
export const ORDER_AMOUNT_FILTERS = ['any', 'under5m', 'over5m'] as const;
export type OrderAmountFilter = (typeof ORDER_AMOUNT_FILTERS)[number];

// Admin-only order list — every real order, not scoped to one buyer.
// Reuses the exact same include/mapping as the buyer-facing getOrderById so
// the derived fulfillment stage is computed identically on both sides.
//
// total and fulfillmentStage aren't stored columns — they're derived from
// items/allocations after the fetch — so sorting by them (or filtering by
// query, which also spans buyer name) can't be pushed down to a Prisma
// orderBy/skip/take. Given this app's real order volume (dozens, not
// millions), it's honestly simpler and just as correct to fetch every
// matching row, sort in JS, then paginate in JS, rather than maintain two
// different sort code paths (DB-level for stored fields, JS-level for
// derived ones).
export async function getOrdersForAdmin({
  status,
  query,
  page = 1,
  sort = 'date',
  dir = 'desc',
  amount = 'any',
}: {
  status?: OrderStatus;
  query?: string;
  page?: number;
  sort?: OrderSortField;
  dir?: SortDir;
  amount?: OrderAmountFilter;
}) {
  const where: Prisma.OrderWhereInput = {
    status: status || undefined,
    OR: query
      ? [
          { id: { contains: query, mode: 'insensitive' } },
          { buyer: { name: { contains: query, mode: 'insensitive' } } },
          { buyer: { businessName: { contains: query, mode: 'insensitive' } } },
        ]
      : undefined,
  };

  const rows = await prisma.order.findMany({ where, include: ORDER_DETAIL_INCLUDE, orderBy: { createdAt: 'desc' } });

  let orders = rows.map(toPlainOrder).map((order) => {
    const stages = getOrderTrackingStages(order);
    const currentStage = stages.find((s) => s.current)!;
    const total = getOrderTotal(order);
    return { ...order, total, fulfillmentStage: currentStage.title, escrowStatus: getEscrowStatus(order) };
  });

  if (amount === 'under5m') orders = orders.filter((o) => o.total < 5_000_000);
  if (amount === 'over5m') orders = orders.filter((o) => o.total >= 5_000_000);

  const sign = dir === 'asc' ? 1 : -1;
  orders = orders.sort((a, b) => {
    switch (sort) {
      case 'id':
        return sign * a.id.localeCompare(b.id);
      case 'buyer':
        return sign * (a.buyer.businessName ?? a.buyer.name).localeCompare(b.buyer.businessName ?? b.buyer.name);
      case 'items':
        return sign * (a.items.length - b.items.length);
      case 'total':
        return sign * (a.total - b.total);
      case 'status':
        return sign * a.status.localeCompare(b.status);
      case 'stage':
        return sign * a.fulfillmentStage.localeCompare(b.fulfillmentStage);
      case 'date':
      default:
        return sign * (a.createdAt.getTime() - b.createdAt.getTime());
    }
  });

  const total = orders.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { orders: paged, total, page, pageSize: PAGE_SIZE, pageCount };
}

export type AdminOrder = Awaited<ReturnType<typeof getOrdersForAdmin>>['orders'][number];

export async function getOrderStatusCounts() {
  const [total, pending, paid, cancelled] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
    prisma.order.count({ where: { status: OrderStatus.PAID } }),
    prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
  ]);
  return { total, pending, paid, cancelled };
}
