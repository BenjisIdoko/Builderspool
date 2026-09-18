import { prisma } from '../prisma';
import { AllocationStatus, BidStatus } from '@prisma/client';

/**
 * When an awarded allocation fails (the seller can't fulfill it), cascades
 * the shortfall to the next-ranked un-awarded bid in the same cycle. If
 * bids are exhausted, it's flagged for manual ops handling — there's no
 * automated final fallback yet (no backup-supplier relationship modeled).
 */
export async function cascadeFailedAllocation(allocationId: string) {
  const failed = await prisma.allocation.findUniqueOrThrow({
    where: { id: allocationId },
    include: { bid: true },
  });

  await prisma.allocation.update({
    where: { id: allocationId },
    data: { status: AllocationStatus.CANCELLED },
  });

  // REJECTED and PARTIALLY_FILLED bids are the real candidates here — both
  // represent real, ranked, unused seller capacity (REJECTED means 0 of the
  // bid's quantityOffered was drawn on; PARTIALLY_FILLED means some of it
  // wasn't). SUBMITTED is never a bid's status after award — awardCycle()
  // always transitions every considered bid to REJECTED/FILLED/
  // PARTIALLY_FILLED — so it was never a real candidate; the common
  // single-winner-takes-all case left every backup bid REJECTED, which this
  // used to exclude, meaning the cascade reported "exhausted" even when
  // real backup capacity existed.
  const nextBid = await prisma.bid.findFirst({
    where: {
      cycleId: failed.bid.cycleId,
      id: { not: failed.bidId },
      status: { in: [BidStatus.REJECTED, BidStatus.PARTIALLY_FILLED] },
      rank: { not: null },
    },
    orderBy: { rank: 'asc' },
  });

  if (!nextBid) {
    console.warn(
      `[bidding] fallback exhausted for allocation ${allocationId} (order item ${failed.orderItemId}) — needs manual ops handling`
    );
    return null;
  }

  return prisma.allocation.create({
    data: {
      bidId: nextBid.id,
      orderItemId: failed.orderItemId,
      quantityFilled: failed.quantityFilled,
      status: AllocationStatus.PENDING,
    },
  });
}
