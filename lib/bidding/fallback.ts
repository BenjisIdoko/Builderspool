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

  const nextBid = await prisma.bid.findFirst({
    where: {
      cycleId: failed.bid.cycleId,
      id: { not: failed.bidId },
      status: { in: [BidStatus.SUBMITTED, BidStatus.PARTIALLY_FILLED] },
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
