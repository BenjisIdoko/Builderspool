import { prisma } from '../prisma';
import { CycleStatus, SourcingScope } from '@prisma/client';
import { getCycleWindowForDate } from './cycleWindow';

/**
 * Assigns a paid OrderItem to its BidCycle, creating the cycle if it's the
 * first item to join it today. An order item only joins a demand cycle once
 * payment is confirmed (via webhook) — never at checkout submission. This
 * prevents abandoned or failed payments from inflating demand pools.
 */
export async function joinCycleForOrderItem(orderItemId: string) {
  const orderItem = await prisma.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { material: true, order: true },
  });

  const region = orderItem.material.sourcingScope === SourcingScope.REGIONAL ? orderItem.order.region : null;
  const { date, cutoffAt } = getCycleWindowForDate(new Date());

  // findFirst-then-create rather than a DB-level upsert — see the uniqueness
  // caveat noted on BidCycle in schema.prisma re: nullable `region`.
  let cycle = await prisma.bidCycle.findFirst({
    where: { materialId: orderItem.materialId, region, date },
  });

  if (!cycle) {
    cycle = await prisma.bidCycle.create({
      data: {
        materialId: orderItem.materialId,
        region,
        date,
        cutoffAt,
        status: CycleStatus.OPEN,
      },
    });
  }

  return prisma.orderItem.update({
    where: { id: orderItemId },
    data: { bidCycleId: cycle.id },
  });
}
