import { prisma } from '../prisma';
import { CycleStatus } from '@prisma/client';
import { resolveCycleBids } from './engine';
import { CycleResolutionReport } from './types';

export interface CycleProcessResult {
  lockedCyclesCount: number;
  resolvedCycles: CycleResolutionReport[];
}

/**
 * Sweeps all cycles to update state based on cutoff times:
 * 1. Transitions expired OPEN cycles (cutoffAt <= now) to LOCKED (or BIDDING).
 * 2. Resolves BIDDING cycles whose bidding window has closed.
 */
export async function closeAndProcessCycles(): Promise<CycleProcessResult> {
  const now = new Date();

  // Find all OPEN cycles that reached or passed their cutoff time
  const expiredOpenCycles = await prisma.demandCycle.findMany({
    where: {
      status: CycleStatus.OPEN,
      cutoffAt: { lte: now },
    },
  });

  let lockedCyclesCount = 0;
  for (const cycle of expiredOpenCycles) {
    await prisma.demandCycle.update({
      where: { id: cycle.id },
      data: { status: CycleStatus.LOCKED },
    });
    lockedCyclesCount++;
  }

  // Find all BIDDING cycles ready to be resolved
  const biddingCyclesToResolve = await prisma.demandCycle.findMany({
    where: {
      status: CycleStatus.BIDDING,
    },
  });

  const resolvedCycles: CycleResolutionReport[] = [];
  for (const cycle of biddingCyclesToResolve) {
    const report = await resolveCycleBids(cycle.id);
    resolvedCycles.push(report);
  }

  return {
    lockedCyclesCount,
    resolvedCycles,
  };
}

/**
 * Creates or retrieves today's default demand cycle.
 */
export async function getOrCreateCurrentCycle(cutoffHourUTC = 17) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let cycle = await prisma.demandCycle.findUnique({
    where: { date: today },
  });

  if (!cycle) {
    const cutoffAt = new Date(today);
    cutoffAt.setUTCHours(cutoffHourUTC, 0, 0, 0);

    cycle = await prisma.demandCycle.create({
      data: {
        date: today,
        cutoffAt,
        status: CycleStatus.OPEN,
      },
    });
  }

  return cycle;
}
