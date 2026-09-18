import { prisma } from '../prisma';
import { AllocationStatus, BidStatus, type Allocation } from '@prisma/client';

/**
 * When an awarded allocation fails (the seller can't fulfill it), cascades
 * the shortfall across next-ranked un-awarded bids in the same cycle,
 * splitting across more than one backup bid if a single one doesn't have
 * enough remaining capacity alone — the same rank-first fill loop
 * award.ts's main pass already uses, just applied to the shortfall instead
 * of the cycle's original demand. If bids run out before the shortfall
 * does, whatever's left is flagged for manual ops handling — there's no
 * automated final fallback yet (no backup-supplier relationship modeled).
 */
export async function cascadeFailedAllocation(allocationId: string): Promise<Allocation[]> {
  return prisma.$transaction(async (tx) => {
    const failed = await tx.allocation.findUniqueOrThrow({
      where: { id: allocationId },
      include: { bid: true },
    });

    await tx.allocation.update({
      where: { id: allocationId },
      data: { status: AllocationStatus.CANCELLED },
    });

    // REJECTED and PARTIALLY_FILLED bids are the real candidates — both
    // represent real, ranked, unused seller capacity (REJECTED means 0 of
    // the bid's quantityOffered was drawn on; PARTIALLY_FILLED means some
    // of it wasn't). SUBMITTED never occurs post-award — awardCycle()
    // always transitions every considered bid to REJECTED/FILLED/
    // PARTIALLY_FILLED.
    const candidates = await tx.bid.findMany({
      where: {
        cycleId: failed.bid.cycleId,
        id: { not: failed.bidId },
        status: { in: [BidStatus.REJECTED, BidStatus.PARTIALLY_FILLED] },
        rank: { not: null },
      },
      orderBy: { rank: 'asc' },
      include: {
        allocations: {
          where: { status: { not: AllocationStatus.CANCELLED } },
          select: { quantityFilled: true },
        },
      },
    });

    let remaining = failed.quantityFilled;
    const created: Allocation[] = [];

    for (const bid of candidates) {
      if (remaining <= 0) break;

      const alreadyFilled = bid.allocations.reduce((sum, a) => sum + a.quantityFilled, 0);
      const remainingCapacity = bid.quantityOffered - alreadyFilled;
      if (remainingCapacity <= 0) continue;

      const fillQuantity = Math.min(remaining, remainingCapacity);

      const allocation = await tx.allocation.create({
        data: {
          bidId: bid.id,
          orderItemId: failed.orderItemId,
          quantityFilled: fillQuantity,
          status: AllocationStatus.PENDING,
        },
      });
      created.push(allocation);
      remaining -= fillQuantity;

      // This bid may have been REJECTED (never drawn on) or already
      // PARTIALLY_FILLED — reflect its genuinely updated fill state now.
      await tx.bid.update({
        where: { id: bid.id },
        data: {
          status: remainingCapacity - fillQuantity <= 0 ? BidStatus.FILLED : BidStatus.PARTIALLY_FILLED,
        },
      });
    }

    if (remaining > 0) {
      console.warn(
        `[bidding] fallback exhausted for allocation ${allocationId} (order item ${failed.orderItemId}) — ${remaining} of ${failed.quantityFilled} units still unfilled, needs manual ops handling`
      );
    }

    return created;
  });
}
