import { prisma } from '../prisma';
import { AllocationStatus, BidStatus, CycleStatus } from '@prisma/client';
import { getEligibleBidsForCycle, scoreBids } from './scoring';
import { notifyBidWon, notifyBidLost } from '../notifications';
import type { CycleCloseReport } from './types';

/**
 * Scores a cycle's eligible bids and fills its order-item demand
 * rank-first, splitting across sellers when the top bid alone can't cover
 * it. If bids run out before demand does, the shortfall is left unfilled
 * and the report is flagged for manual ops handling — there is no
 * automated final fallback (see fallback.ts for the post-award cascade).
 */
export async function awardCycle(cycleId: string): Promise<CycleCloseReport> {
  const orderItems = await prisma.orderItem.findMany({
    where: { bidCycleId: cycleId },
    orderBy: { createdAt: 'asc' },
  });
  const totalQuantityRequested = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const { eligibleBids } = await getEligibleBidsForCycle(cycleId);
  const ranked = scoreBids(eligibleBids, totalQuantityRequested);

  const bidCapacities = ranked.map((r, i) => ({
    bidId: r.bid.id,
    rank: i + 1,
    score: r.score,
    remainingCapacity: r.bid.quantityOffered,
    filled: 0,
  }));

  let totalQuantityAllocated = 0;

  await prisma.$transaction(async (tx) => {
    for (const item of orderItems) {
      let remainingNeed = item.quantity;

      for (const cap of bidCapacities) {
        if (remainingNeed <= 0) break;
        if (cap.remainingCapacity <= 0) continue;

        const fillQuantity = Math.min(remainingNeed, cap.remainingCapacity);

        await tx.allocation.create({
          data: {
            bidId: cap.bidId,
            orderItemId: item.id,
            quantityFilled: fillQuantity,
            status: AllocationStatus.PENDING,
          },
        });

        cap.remainingCapacity -= fillQuantity;
        cap.filled += fillQuantity;
        remainingNeed -= fillQuantity;
        totalQuantityAllocated += fillQuantity;
      }
    }

    for (const cap of bidCapacities) {
      await tx.bid.update({
        where: { id: cap.bidId },
        data: {
          score: cap.score,
          rank: cap.rank,
          status:
            cap.filled === 0
              ? BidStatus.REJECTED
              : cap.remainingCapacity === 0
                ? BidStatus.FILLED
                : BidStatus.PARTIALLY_FILLED,
        },
      });
    }

    await tx.bidCycle.update({
      where: { id: cycleId },
      data: { status: CycleStatus.AWARDED },
    });
  });

  const needsAttention = totalQuantityAllocated < totalQuantityRequested;
  if (needsAttention) {
    console.warn(
      `[bidding] cycle ${cycleId} awarded with unmet demand: ${totalQuantityRequested - totalQuantityAllocated} units unfilled — needs ops attention`
    );
  }

  // Real award outcome per bid, after the transaction has actually
  // committed — every seller who bid in this cycle finds out whether they
  // won (and how much) or lost, not just the ones who check back later.
  if (bidCapacities.length > 0) {
    const material = await prisma.material.findUniqueOrThrow({
      where: { id: ranked[0].bid.materialId },
      select: { name: true, unit: true },
    });
    await Promise.all(
      bidCapacities.map((cap) => {
        const scored = ranked.find((r) => r.bid.id === cap.bidId)!;
        return cap.filled > 0
          ? notifyBidWon(scored.bid.sellerId, material.name, cap.filled, material.unit)
          : notifyBidLost(scored.bid.sellerId, material.name);
      })
    );
  }

  return {
    cycleId,
    closedAt: new Date(),
    totalBidsConsidered: ranked.length,
    totalAllocationsCreated: bidCapacities.filter((c) => c.filled > 0).length,
    totalQuantityAllocated,
    totalQuantityRequested,
    needsAttention,
  };
}

/** Finds OPEN cycles past their cutoff, closes them to new demand/bids, and awards them. */
export async function closeDueCycles(now = new Date()): Promise<CycleCloseReport[]> {
  const dueCycles = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.OPEN, cutoffAt: { lte: now } },
  });

  const reports: CycleCloseReport[] = [];
  for (const cycle of dueCycles) {
    await prisma.bidCycle.update({
      where: { id: cycle.id },
      data: { status: CycleStatus.CLOSED },
    });
    reports.push(await awardCycle(cycle.id));
  }

  return reports;
}
