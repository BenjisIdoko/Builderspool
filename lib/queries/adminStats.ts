import { prisma } from '../prisma';
import { AllocationStatus, CycleStatus, OrderStatus } from '@prisma/client';
import { getOrderTotal } from '../checkout/orderTotal';

// Real, derivable platform KPIs for the admin dashboard's summary strip —
// no schema change, nothing fabricated. Margin is computed the same way a
// real settlement report would: catalogue price minus what we actually paid
// the winning seller, per unit actually filled.
export async function getAdminKpis() {
  const paidOrders = await prisma.order.findMany({
    where: { status: OrderStatus.PAID },
    include: { items: { select: { priceLocked: true, deliveryCost: true, quantity: true } } },
  });
  const platformGmv = paidOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);

  const allocations = await prisma.allocation.findMany({
    where: { status: { not: AllocationStatus.CANCELLED } },
    select: {
      quantityFilled: true,
      receivedAt: true,
      bid: { select: { unitPrice: true, material: { select: { catalogPrice: true } } } },
    },
  });
  const margin = allocations.reduce(
    (sum, a) => sum + (Number(a.bid.material.catalogPrice) - Number(a.bid.unitPrice)) * a.quantityFilled,
    0
  );
  const materialVolume = allocations.reduce((sum, a) => sum + a.quantityFilled, 0);
  const pendingGrnCount = allocations.filter((a) => !a.receivedAt).length;

  const activeDemandPools = await prisma.bidCycle.count({ where: { status: CycleStatus.OPEN } });

  return { platformGmv, margin, activeDemandPools, materialVolume, pendingGrnCount };
}

export async function getRecentOrders(limit = 6) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      buyer: { select: { name: true, businessName: true, email: true } },
      items: { select: { priceLocked: true, deliveryCost: true, quantity: true, material: { select: { name: true } } } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    buyer: order.buyer,
    material: order.items[0]?.material.name ?? '—',
    extraItemCount: Math.max(0, order.items.length - 1),
    amount: getOrderTotal(order),
  }));
}

// A real daily GMV trend, not a fabricated multi-week history we have no
// rollup table for — 5 real calendar days, including days with zero paid
// orders.
export async function getDailyGmv(days = 5) {
  const paidOrders = await prisma.order.findMany({
    where: { status: OrderStatus.PAID },
    select: { paidAt: true, items: { select: { priceLocked: true, deliveryCost: true, quantity: true } } },
  });

  const buckets: { date: Date; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    buckets.push({ date, total: 0 });
  }

  for (const order of paidOrders) {
    if (!order.paidAt) continue;
    const paidDate = new Date(order.paidAt);
    paidDate.setUTCHours(0, 0, 0, 0);
    const bucket = buckets.find((b) => b.date.getTime() === paidDate.getTime());
    if (!bucket) continue;
    bucket.total += getOrderTotal(order);
  }

  return buckets;
}
