import { SheetAwardStatus, SheetStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { freezeSheet } from './freeze';
import { closeSheetBidding } from './evaluate';
import { advanceAwards } from './award';
import { settleSheet } from './settle';

export interface SheetTickReport {
  frozen: string[];
  closed: string[];
  awardsExpired: string[];
  settled: string[];
}

/**
 * Advances every sheet whose deadline has passed, one stage per sheet per call.
 * Each stage is a compare-and-swap, so cron, the page-load nudge and an admin's
 * button can all run it at once.
 */
export async function advanceSheets(now = new Date()): Promise<SheetTickReport> {
  const report: SheetTickReport = { frozen: [], closed: [], awardsExpired: [], settled: [] };

  const toFreeze = await prisma.poolSheet.findMany({ where: { status: SheetStatus.OPEN, poolClosesAt: { lte: now } }, select: { id: true } });
  for (const { id } of toFreeze) if (await freezeSheet(id, now)) report.frozen.push(id);

  const toClose = await prisma.poolSheet.findMany({ where: { status: SheetStatus.BIDDING, bidsCloseAt: { lte: now } }, select: { id: true } });
  for (const { id } of toClose) if (await closeSheetBidding(id)) report.closed.push(id);

  const awards = await advanceAwards(now);
  report.awardsExpired = awards.expired;

  // Finished sheets whose outcome has not been carried out yet (also retries a settle that stopped midway).
  const unsettled = await prisma.poolSheet.findMany({ where: { status: { in: [SheetStatus.AWARDED, SheetStatus.CANCELLED] }, settledAt: null }, select: { id: true }, take: 50 });
  for (const { id } of unsettled) if (await settleSheet(id, now)) report.settled.push(id);

  return report;
}

export async function countDueSheets(now = new Date()): Promise<number> {
  return prisma.poolSheet.count({
    where: {
      OR: [
        { status: SheetStatus.OPEN, poolClosesAt: { lte: now } },
        { status: SheetStatus.BIDDING, bidsCloseAt: { lte: now } },
        // an offer past its window, or an AWARDING sheet with nothing open
        { status: SheetStatus.AWARDING, awards: { some: { status: SheetAwardStatus.OFFERED, expiresAt: { lte: now } } } },
        { status: SheetStatus.AWARDING, awards: { none: { status: { in: [SheetAwardStatus.OFFERED, SheetAwardStatus.ACCEPTED] } } } },
        { status: { in: [SheetStatus.AWARDED, SheetStatus.CANCELLED] }, settledAt: null },
      ],
    },
  });
}
