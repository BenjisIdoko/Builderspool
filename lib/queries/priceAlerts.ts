import { prisma } from '../prisma';

// "Reached" is computed live against the real catalogPrice, not stored —
// there's no notification delivery yet (see prisma/schema.prisma's
// PriceAlert model comment), so this is the only honest signal available:
// whether the condition the buyer asked for is currently true.
export async function getPriceAlertsForBuyer(buyerId: string) {
  const alerts = await prisma.priceAlert.findMany({
    where: { buyerId, active: true },
    include: {
      material: { select: { id: true, name: true, unit: true, catalogPrice: true, imageUrl: true, category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return alerts.map((alert) => ({
    id: alert.id,
    targetPrice: Number(alert.targetPrice),
    createdAt: alert.createdAt,
    material: {
      ...alert.material,
      catalogPrice: Number(alert.material.catalogPrice),
    },
    reached: Number(alert.material.catalogPrice) <= Number(alert.targetPrice),
  }));
}

export type BuyerPriceAlert = Awaited<ReturnType<typeof getPriceAlertsForBuyer>>[number];
