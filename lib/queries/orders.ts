import { prisma } from '../prisma';

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          material: { select: { name: true, category: true, unit: true, imageUrl: true } },
          fulfillmentCenter: { select: { name: true, address: true, region: true } },
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
