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
