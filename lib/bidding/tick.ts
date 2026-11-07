import { prisma } from '../prisma';
import { AllocationStatus, CycleStatus, DirectStatus } from '@prisma/client';
import { notifyCycleOpened } from '../notifications';
import { expireOverdueDirect } from '../direct';
import { advanceSheets, countDueSheets } from '../sheets/tick';
import { awardCycle } from './award';
import { expireOverdueAllocations, finalizeCycleFallback, type FallbackReport } from './fallback';
import type { CycleCloseReport } from './types';

export interface TickReport {
  frozen: string[];
  awarded: CycleCloseReport[];
  expiredAwards: number;
  expiredDirect: number;
  fallbacks: FallbackReport[];
  sheetsFrozen: string[];
  sheetsClosed: string[];
}

// Moves a cycle OPEN -> BIDDING: demand is frozen, the RFQ is issued and
// eligible sellers are told bidding is open. Atomic compare-and-swap, so an
// overlapping run or an admin's manual advance can't freeze it twice.
export async function freezeCycle(cycleId: string, now = new Date()): Promise<boolean> {
  const { count } = await prisma.bidCycle.updateMany({
    where: { id: cycleId, status: CycleStatus.OPEN },
    data: { status: CycleStatus.BIDDING, frozenAt: now },
  });
  if (count === 0) return false;

  const cycle = await prisma.bidCycle.findUniqueOrThrow({ where: { id: cycleId }, include: { material: { select: { name: true } } } });
  await notifyCycleOpened(cycle, cycle.material.name);
  return true;
}

// Closes bidding and awards: BIDDING -> CLOSED (compare-and-swap) -> AWARDED.
// awardCycle isn't idempotent, so only the caller that wins the swap awards.
export async function closeAndAwardCycle(cycleId: string): Promise<CycleCloseReport | null> {
  const { count } = await prisma.bidCycle.updateMany({
    where: { id: cycleId, status: CycleStatus.BIDDING },
    data: { status: CycleStatus.CLOSED },
  });
  if (count === 0) return null;
  return awardCycle(cycleId);
}

/**
 * Advances every cycle whose deadline has passed, one stage per cycle per
 * call. Safe to run as often as you like and from several places (cron,
 * page-load nudge, admin button): each stage is a compare-and-swap.
 */
export async function advanceCycles(now = new Date()): Promise<TickReport> {
  const report: TickReport = { frozen: [], awarded: [], expiredAwards: 0, expiredDirect: 0, fallbacks: [], sheetsFrozen: [], sheetsClosed: [] };

  const toFreeze = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.OPEN, poolClosesAt: { lte: now } },
    select: { id: true },
  });
  for (const { id } of toFreeze) if (await freezeCycle(id, now)) report.frozen.push(id);

  const toAward = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.BIDDING, bidsCloseAt: { lte: now } },
    select: { id: true },
  });
  for (const { id } of toAward) {
    const result = await closeAndAwardCycle(id);
    if (result) report.awarded.push(result);
  }

  // Awards nobody accepted by the deadline pass to the next-ranked bids (or
  // lapse, if they already passed once); then cycles past their fallback time
  // mark whatever is still uncovered as unsuccessful for the buyer. Expiry
  // runs first so the fallback sees the final picture.
  report.expiredAwards = await expireOverdueAllocations(now);
  report.expiredDirect = await expireOverdueDirect(now);

  const toFinalize = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.AWARDED, fallbackProcessedAt: null, fallbackAt: { lte: now } },
    select: { id: true },
  });
  for (const { id } of toFinalize) {
    const result = await finalizeCycleFallback(id, now);
    if (result) report.fallbacks.push(result);
  }

  // Category sheets run on their own clock; each stage is its own compare-and-swap.
  const sheets = await advanceSheets(now);
  report.sheetsFrozen = sheets.frozen;
  report.sheetsClosed = sheets.closed;

  return report;
}

let lastNudge = 0;

// A cheap check any page can call: if a cycle deadline has passed, advance.
// Throttled to once a minute per server instance. This keeps the timeline
// honest on hosting plans that only allow a daily cron.
export async function maybeAdvanceCycles(): Promise<void> {
  const now = new Date();
  if (now.getTime() - lastNudge < 60_000) return;
  lastNudge = now.getTime();

  const due = await prisma.bidCycle.count({
    where: {
      OR: [
        { status: CycleStatus.OPEN, poolClosesAt: { lte: now } },
        { status: CycleStatus.BIDDING, bidsCloseAt: { lte: now } },
        { status: CycleStatus.AWARDED, fallbackProcessedAt: null, fallbackAt: { lte: now } },
      ],
    },
  });
  const overdueAwards = await prisma.allocation.count({
    where: { status: AllocationStatus.PENDING, acceptDeadlineAt: { lte: now } },
  });
  const overdueDirect = await prisma.directFulfilment.count({
    where: { status: DirectStatus.AWAITING_ACCEPT, acceptDeadlineAt: { lte: now } },
  });
  const dueSheets = await countDueSheets(now);
  if (due + overdueAwards + overdueDirect + dueSheets > 0) await advanceCycles(now);
}
