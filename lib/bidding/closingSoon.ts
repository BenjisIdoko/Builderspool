import { prisma } from '../prisma';
import { CycleStatus } from '@prisma/client';
import { notifyCycleClosingSoon } from '../notifications';

/**
 * Notifies every eligible seller for each cycle still taking bids whose
 * bidding closes within the next hour.
 */
export async function notifyCyclesClosingSoon(now = new Date()) {
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const cycles = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.BIDDING, cutoffAt: { gte: now, lte: oneHourFromNow } },
    include: { material: { select: { name: true } } },
  });

  await Promise.all(cycles.map((cycle) => notifyCycleClosingSoon(cycle, cycle.material.name)));

  return { cyclesNotified: cycles.length };
}
