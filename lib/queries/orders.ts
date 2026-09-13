import { prisma } from '../prisma';

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          material: { select: { name: true, category: true, unit: true, imageUrl: true } },
          fulfillmentCenter: { select: { name: true, address: true, region: true } },
          bidCycle: { select: { status: true } },
          allocations: { select: { receivedAt: true } },
        },
      },
    },
  });
  if (!order) return null;

  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      priceLocked: Number(item.priceLocked),
      deliveryCost: Number(item.deliveryCost),
    })),
  };
}

export type BuyerOrder = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

export interface TrackingStage {
  key: string;
  title: string;
  achieved: boolean;
  current: boolean;
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

  const titles = [
    'Order confirmed',
    'Payment confirmed',
    'Demand pooled',
    'Supplier assigned',
    isPickup ? 'Ready for pickup' : 'Out for delivery',
    isPickup ? 'Picked up' : 'Delivered',
  ];

  return titles.map((title, i) => ({
    key: title,
    title,
    achieved: i <= currentIndex,
    current: i === currentIndex,
  }));
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
    total: order.items.reduce(
      (sum, item) => sum + Number(item.priceLocked) * item.quantity + Number(item.deliveryCost),
      0
    ),
  }));
}

export type BuyerOrderSummary = Awaited<ReturnType<typeof getOrdersForBuyer>>[number];
