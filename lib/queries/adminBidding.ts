import { prisma } from '../prisma';

export async function getAllCycles() {
  const cycles = await prisma.bidCycle.findMany({
    include: {
      material: { select: { name: true, category: true, unit: true } },
      orderItems: { select: { quantity: true } },
      bids: { select: { status: true } },
    },
    orderBy: [{ cutoffAt: 'desc' }, { createdAt: 'desc' }],
  });

  return cycles.map((cycle) => ({
    id: cycle.id,
    material: cycle.material,
    region: cycle.region,
    date: cycle.date,
    cutoffAt: cycle.cutoffAt,
    status: cycle.status,
    totalQuantityRequested: cycle.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    orderItemCount: cycle.orderItems.length,
    bidCount: cycle.bids.length,
  }));
}

export async function getCycleDetail(id: string) {
  const cycle = await prisma.bidCycle.findUnique({
    where: { id },
    include: {
      material: true,
      orderItems: {
        include: { order: { select: { id: true, buyerId: true } } },
      },
      bids: {
        include: {
          seller: { select: { name: true, businessName: true } },
          allocations: true,
        },
        orderBy: [{ rank: 'asc' }, { submittedAt: 'asc' }],
      },
    },
  });
  if (!cycle) return null;

  const totalQuantityRequested = cycle.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalQuantityAllocated = cycle.bids.reduce(
    (sum, bid) =>
      sum + bid.allocations.reduce((s, a) => s + (a.status !== 'CANCELLED' ? a.quantityFilled : 0), 0),
    0
  );

  return {
    id: cycle.id,
    material: cycle.material,
    region: cycle.region,
    date: cycle.date,
    cutoffAt: cycle.cutoffAt,
    status: cycle.status,
    totalQuantityRequested,
    totalQuantityAllocated,
    needsAttention: cycle.status === 'AWARDED' && totalQuantityAllocated < totalQuantityRequested,
    orderItems: cycle.orderItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      orderId: item.order.id,
    })),
    bids: cycle.bids.map((bid) => ({
      id: bid.id,
      sellerName: bid.seller.businessName ?? bid.seller.name,
      unitPrice: Number(bid.unitPrice),
      quantityOffered: bid.quantityOffered,
      estimatedDeliveryDays: bid.estimatedDeliveryDays,
      score: bid.score,
      rank: bid.rank,
      status: bid.status,
      allocations: bid.allocations.map((a) => ({
        id: a.id,
        quantityFilled: a.quantityFilled,
        status: a.status,
        receivedAt: a.receivedAt,
        grnNumber: a.grnNumber,
        payoutStatus: a.payoutStatus,
        payoutReference: a.payoutReference,
        paidAt: a.paidAt,
        holdReason: a.holdReason,
      })),
    })),
  };
}

export type AdminCycleSummary = Awaited<ReturnType<typeof getAllCycles>>[number];
export type AdminCycleDetail = NonNullable<Awaited<ReturnType<typeof getCycleDetail>>>;
