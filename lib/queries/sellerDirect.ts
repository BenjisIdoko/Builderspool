import { prisma } from '@/lib/prisma';

// Buy Direct lines waiting on, or in progress with, this seller. Newest first.
// The buyer is named by business or name; the delivery site is never shown,
// since goods go to the fulfilment centre first.
export async function getSellerDirectOrders(sellerId: string) {
  const rows = await prisma.directFulfilment.findMany({
    where: { sellerId },
    include: {
      orderItem: {
        select: {
          material: { select: { name: true, unit: true } },
          fulfillmentCenter: { select: { name: true, address: true } },
          order: { select: { buyer: { select: { name: true, businessName: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    material: r.orderItem.material.name,
    unit: r.orderItem.material.unit,
    quantity: r.quantity,
    amount: Number(r.unitPrice) * r.quantity,
    status: r.status,
    payoutStatus: r.payoutStatus,
    acceptDeadlineAt: r.acceptDeadlineAt,
    declineReason: r.declineReason,
    grnNumber: r.grnNumber,
    buyer: r.orderItem.order.buyer.businessName?.trim() || r.orderItem.order.buyer.name,
    centerName: r.orderItem.fulfillmentCenter?.name ?? null,
    centerAddress: r.orderItem.fulfillmentCenter?.address ?? null,
  }));
}
