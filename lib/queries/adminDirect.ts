import { prisma } from '@/lib/prisma';

// Every Buy Direct line, with what ops need to receive and pay it. Lines still
// waiting on the seller come first, then accepted ones awaiting goods.
export async function getAdminDirectLines() {
  const rows = await prisma.directFulfilment.findMany({
    include: {
      seller: { select: { businessName: true, name: true } },
      orderItem: {
        select: {
          orderId: true,
          material: { select: { name: true, unit: true } },
          fulfillmentCenter: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const rank: Record<string, number> = { AWAITING_ACCEPT: 0, ACCEPTED: 1, FULFILLED: 2, DECLINED: 3, EXPIRED: 3 };
  return rows
    .map((r) => ({
      id: r.id,
      orderId: r.orderItem.orderId,
      material: r.orderItem.material.name,
      unit: r.orderItem.material.unit,
      quantity: r.quantity,
      amount: Number(r.unitPrice) * r.quantity,
      seller: r.seller.businessName?.trim() || r.seller.name,
      center: r.orderItem.fulfillmentCenter?.name ?? null,
      status: r.status,
      payoutStatus: r.payoutStatus,
      acceptDeadlineAt: r.acceptDeadlineAt,
      grnNumber: r.grnNumber,
      payoutReference: r.payoutReference,
    }))
    .sort((a, b) => rank[a.status] - rank[b.status]);
}
