import { prisma } from '../prisma';
import { CycleStatus, SourcingScope } from '@prisma/client';
import { addDaysYmd, buildCycleSchedule, cycleDateFor, ymdToDbDate } from './schedule';
import { getCycleTimes } from './cycleTimes';

/**
 * Assigns a paid OrderItem to its BidCycle, creating the cycle if it's the
 * first item to join it. An order item only joins a demand cycle once payment
 * is confirmed (via webhook) — never at checkout submission — so abandoned or
 * failed payments never inflate demand pools.
 *
 * Demand collects until the pool closes (17:00 Lagos by default). A payment
 * confirmed after that, or into a cycle already frozen, belongs to the next
 * day's cycle. Sellers are told about a cycle when it is frozen and bidding
 * opens (see tick.ts), not when it's created, because they can't bid before.
 */
export async function joinCycleForOrderItem(orderItemId: string) {
  const orderItem = await prisma.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { material: true, order: true },
  });

  const region = orderItem.material.sourcingScope === SourcingScope.REGIONAL ? orderItem.order.region : null;
  const times = await getCycleTimes();

  let ymd = cycleDateFor(new Date(), times.poolCloseTime);
  let cycle = null;
  // findFirst-then-create rather than a DB-level upsert — see the uniqueness
  // caveat noted on BidCycle in schema.prisma re: nullable `region`. A cycle
  // that has already left OPEN (frozen early by an admin) is skipped.
  for (let attempt = 0; attempt < 4; attempt++) {
    const date = ymdToDbDate(ymd);
    const existing = await prisma.bidCycle.findFirst({ where: { materialId: orderItem.materialId, region, date } });
    if (!existing) {
      const schedule = buildCycleSchedule(ymd, times);
      cycle = await prisma.bidCycle.create({
        data: {
          materialId: orderItem.materialId,
          region,
          date,
          cutoffAt: schedule.bidsCloseAt,
          poolClosesAt: schedule.poolClosesAt,
          bidsCloseAt: schedule.bidsCloseAt,
          acceptDeadlineAt: schedule.acceptDeadlineAt,
          fallbackAt: schedule.fallbackAt,
          status: CycleStatus.OPEN,
        },
      });
      break;
    }
    if (existing.status === CycleStatus.OPEN) {
      cycle = existing;
      break;
    }
    ymd = addDaysYmd(ymd, 1);
  }
  if (!cycle) throw new Error('Could not find an open demand cycle for this order item.');

  return prisma.orderItem.update({
    where: { id: orderItemId },
    data: { bidCycleId: cycle.id },
  });
}
