import { prisma } from '../prisma';
import { CycleStatus } from '@prisma/client';
import { notifyCycleClosingSoon } from '../notifications';

/**
 * Notifies every eligible seller for each OPEN cycle whose cutoff falls
 * within the next hour — driven by the closing-soon cron
 * (vercel.json, an hour before the daily cutoff), not a per-cycle timer,
 * since every cycle shares the same daily CUTOFF_HOUR.
 */
export async function notifyCyclesClosingSoon(now = new Date()) {
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const cycles = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.OPEN, cutoffAt: { gte: now, lte: oneHourFromNow } },
    include: { material: { select: { name: true } } },
  });

  await Promise.all(cycles.map((cycle) => notifyCycleClosingSoon(cycle, cycle.material.name)));

  return { cyclesNotified: cycles.length };
}
