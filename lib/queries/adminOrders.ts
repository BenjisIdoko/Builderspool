import { prisma } from '../prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { ORDER_DETAIL_INCLUDE, toPlainOrder, getOrderTrackingStages } from './orders';

const PAGE_SIZE = 10;

// Admin-only order list — every real order, not scoped to one buyer.
// Reuses the exact same include/mapping as the buyer-facing getOrderById so
// the derived fulfillment stage is computed identically on both sides.
export async function getOrdersForAdmin({
  status,
  query,
  page = 1,
}: {
  status?: OrderStatus;
  query?: string;
  page?: number;
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

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: ORDER_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const orders = rows.map(toPlainOrder).map((order) => {
    const stages = getOrderTrackingStages(order);
    const currentStage = stages.find((s) => s.current)!;
    const total = order.items.reduce((sum, item) => sum + item.priceLocked * item.quantity + item.deliveryCost, 0);
    return { ...order, total, fulfillmentStage: currentStage.title };
  });

  return { orders, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
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
