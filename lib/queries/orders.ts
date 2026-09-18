import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { getOrderTotal } from '../checkout/orderTotal';

// Shared with lib/queries/adminOrders.ts — same real fields whether a buyer
// is viewing their own order or an admin is viewing any order, just a
// different set of rows selected at the call site.
export const ORDER_DETAIL_INCLUDE = {
  buyer: { select: { name: true, email: true, phone: true, businessName: true } },
  items: {
    include: {
      material: { select: { id: true, name: true, category: true, unit: true, imageUrl: true, catalogPrice: true } },
      fulfillmentCenter: { select: { name: true, address: true, region: true } },
      bidCycle: { select: { status: true } },
      allocations: {
        select: {
          createdAt: true,
          receivedAt: true,
          grnNumber: true,
          payoutStatus: true,
          bid: { select: { estimatedDeliveryDays: true } },
        },
      },
      // Real haulage tracking (2026-09-16) — the platform's own dispatch,
      // not seller-attributed, so surfacing it to the buyer never leaks
      // which seller is fulfilling the order.
      dispatch: {
        select: {
          status: true,
          dispatchedAt: true,
          deliveredAt: true,
          currentLocation: true,
          vehicle: {
            select: { plateNumber: true, type: true, driver: { select: { name: true, phone: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof ORDER_DETAIL_INCLUDE }>;

export function toPlainOrder(order: OrderWithDetails) {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      priceLocked: Number(item.priceLocked),
      deliveryCost: Number(item.deliveryCost),
      material: { ...item.material, catalogPrice: Number(item.material.catalogPrice) },
    })),
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: ORDER_DETAIL_INCLUDE,
  });
  if (!order) return null;

  return toPlainOrder(order);
}

export type BuyerOrder = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

export interface TrackingStage {
  key: string;
  title: string;
  achieved: boolean;
  current: boolean;
  // Real timestamp for this exact stage, only when a dedicated field backs
  // it — null rather than an approximated/borrowed timestamp. "Demand
  // pooled" has no dedicated field (BidCycle.createdAt describes the cycle,
  // not necessarily this item's join moment), so it's always null.
  at: Date | null;
}

// Derived entirely from data we already have — no OrderStatus enum change.
// Each stage has a genuinely distinct, real trigger except the last, which
// this system has no signal for yet and always shows as pending rather than
// a fabricated "Delivered" checkmark. A multi-item order is only as far
// along as its least-advanced item.
export function getOrderTrackingStages(order: BuyerOrder): TrackingStage[] {
  const isPickup = order.items.every((item) => item.deliveryCost === 0);

  const itemStageIndex = (item: BuyerOrder['items'][number]) => {
    const received = item.allocations.some((a) => a.receivedAt);
    if (received) return 4;
    const assigned = item.allocations.length > 0;
    if (assigned) return 3;
    if (item.bidCycleId) return 2;
    if (order.status === 'PAID') return 1;
    return 0;
  };

  const currentIndex =
    order.items.length === 0 ? 0 : Math.min(...order.items.map(itemStageIndex));

  // Earliest real timestamp across items for stages 3/4 — "as far along as
  // the least-advanced item" for the stage index, matched by the earliest
  // moment any item actually reached it.
  const allAllocations = order.items.flatMap((item) => item.allocations);
  const assignedAt = minDate(allAllocations.map((a) => a.createdAt));
  const receivedAt = minDate(allAllocations.filter((a) => a.receivedAt).map((a) => a.receivedAt!));

  const titles = [
    'Order confirmed',
    'Payment confirmed',
    'Demand pooled',
    'Supplier assigned',
    isPickup ? 'Ready for pickup' : 'Out for delivery',
    isPickup ? 'Picked up' : 'Delivered',
  ];
  const timestamps: (Date | null)[] = [order.createdAt, order.paidAt, null, assignedAt, receivedAt, null];

  return titles.map((title, i) => ({
    key: title,
    title,
    achieved: i <= currentIndex,
    current: i === currentIndex,
    at: i <= currentIndex ? timestamps[i] : null,
  }));
}

function minDate(dates: Date[]): Date | null {
  return dates.length === 0 ? null : new Date(Math.min(...dates.map((d) => d.getTime())));
}

export async function getOrdersForBuyer(buyerId: string) {
  const orders = await prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { select: { priceLocked: true, deliveryCost: true, quantity: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    itemCount: order.items.length,
    total: getOrderTotal(order),
  }));
}

export type BuyerOrderSummary = Awaited<ReturnType<typeof getOrdersForBuyer>>[number];
