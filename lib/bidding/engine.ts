import { prisma } from '../prisma';
import { BidStatus, CycleStatus, AllocationStatus } from '@prisma/client';
import { CycleResolutionReport, AllocationDetail } from './types';

/**
 * Executes the bidding resolution engine for a specific DemandCycle.
 * Allocates winning seller bids (lowest price first) to buyer cart items.
 */
export async function resolveCycleBids(cycleId: string): Promise<CycleResolutionReport> {
  const cycle = await prisma.demandCycle.findUnique({
    where: { id: cycleId },
  });

  if (!cycle) {
    throw new Error(`DemandCycle with ID ${cycleId} not found.`);
  }

  // Fetch all CartItems for this cycle
  const cartItems = await prisma.cartItem.findMany({
    where: { cycleId },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch all SUBMITTED bids for this cycle, sorted by material and lowest pricePerUnit
  const bids = await prisma.bid.findMany({
    where: { cycleId, status: BidStatus.SUBMITTED },
    orderBy: [
      { materialId: 'asc' },
      { pricePerUnit: 'asc' },
      { submittedAt: 'asc' },
    ],
  });

  // Group cart items and bids by materialId
  const cartItemsByMaterial = new Map<string, typeof cartItems>();
  for (const item of cartItems) {
    const list = cartItemsByMaterial.get(item.materialId) || [];
    list.push(item);
    cartItemsByMaterial.set(item.materialId, list);
  }

  const bidsByMaterial = new Map<string, typeof bids>();
  for (const bid of bids) {
    const list = bidsByMaterial.get(bid.materialId) || [];
    list.push(bid);
    bidsByMaterial.set(bid.materialId, list);
  }

  const allocationDetails: AllocationDetail[] = [];
  let totalBidsProcessed = bids.length;
  let totalQuantityAllocated = 0;

  // Process resolution inside a database transaction
  await prisma.$transaction(async (tx) => {
    for (const [materialId, materialCartItems] of cartItemsByMaterial.entries()) {
      const materialBids = bidsByMaterial.get(materialId) || [];

      // Track remaining capacity per bid and remaining need per cart item
      const bidCapacities = materialBids.map((b) => ({
        bid: b,
        remainingCapacity: b.maxQuantity,
        filledQuantity: 0,
      }));

      const itemNeeds = materialCartItems.map((ci) => ({
        cartItem: ci,
        remainingNeed: ci.quantity,
      }));

      for (const itemNeed of itemNeeds) {
        if (itemNeed.remainingNeed <= 0) continue;

        for (const bidCap of bidCapacities) {
          if (bidCap.remainingCapacity <= 0) continue;

          const fillQuantity = Math.min(itemNeed.remainingNeed, bidCap.remainingCapacity);

          if (fillQuantity > 0) {
            // Create Allocation
            await tx.allocation.create({
              data: {
                bidId: bidCap.bid.id,
                cartItemId: itemNeed.cartItem.id,
                quantityFilled: fillQuantity,
                status: AllocationStatus.PENDING,
              },
            });

            bidCap.remainingCapacity -= fillQuantity;
            bidCap.filledQuantity += fillQuantity;
            itemNeed.remainingNeed -= fillQuantity;
            totalQuantityAllocated += fillQuantity;

            allocationDetails.push({
              bidId: bidCap.bid.id,
              cartItemId: itemNeed.cartItem.id,
              materialId,
              quantityFilled: fillQuantity,
              pricePerUnit: Number(bidCap.bid.pricePerUnit),
            });
          }

          if (itemNeed.remainingNeed === 0) break;
        }
      }

      // Update Bid statuses based on filled quantities
      for (const bidCap of bidCapacities) {
        let newStatus: BidStatus = BidStatus.REJECTED;
        if (bidCap.filledQuantity === bidCap.bid.maxQuantity) {
          newStatus = BidStatus.FILLED;
        } else if (bidCap.filledQuantity > 0) {
          newStatus = BidStatus.PARTIALLY_FILLED;
        }

        await tx.bid.update({
          where: { id: bidCap.bid.id },
          data: { status: newStatus },
        });
      }
    }

    // Mark DemandCycle as RESOLVED
    await tx.demandCycle.update({
      where: { id: cycleId },
      data: { status: CycleStatus.RESOLVED },
    });
  });

  return {
    cycleId,
    resolvedAt: new Date(),
    totalBidsProcessed,
    totalAllocationsCreated: allocationDetails.length,
    totalQuantityAllocated,
    allocations: allocationDetails,
  };
}
