import { prisma } from '../prisma';
import { BidStatus, CycleStatus } from '@prisma/client';
import { isSellerEligible } from '../bidding/scoring';

export async function getSellerProfile(userId: string) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  return profile ? { ...profile, trustScore: Number(profile.trustScore) } : null;
}

// Open bid cycles this seller is eligible to bid on — geography-filtered
// the same way the award engine filters at close time (lib/bidding/scoring.ts),
// so a seller never sees an opportunity they'd be excluded from anyway.
// Shows only the information a blind bidder is meant to see: material spec,
// aggregated demand, region and cutoff — never other sellers' bids or any
// buyer identity.
export async function getOpenCyclesForSeller(sellerId: string) {
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: sellerId } });

  const cycles = await prisma.bidCycle.findMany({
    where: { status: CycleStatus.OPEN },
    include: {
      material: true,
      orderItems: { select: { quantity: true } },
      // A cycle is only ever OPEN pre-award, so a seller's bid on it can
      // only be SUBMITTED or WITHDRAWN — excluding WITHDRAWN here so a
      // seller who withdrew their only bid sees "Submit bid" again instead
      // of their stale withdrawn values still showing as "current."
      bids: { where: { sellerId, status: BidStatus.SUBMITTED }, orderBy: { submittedAt: 'desc' }, take: 1 },
    },
    orderBy: [{ cutoffAt: 'asc' }, { createdAt: 'asc' }],
  });

  return cycles
    .filter((cycle) => isSellerEligible(profile, cycle))
    .map((cycle) => {
      const myBid = cycle.bids[0];
      return {
        id: cycle.id,
        // Decimal fields (catalogPrice) don't serialize across the server/
        // client boundary — this page passes cycles into a client-side bid
        // dialog, so plain numbers are required here, not just convenient.
        material: { ...cycle.material, catalogPrice: Number(cycle.material.catalogPrice) },
        region: cycle.region,
        cutoffAt: cycle.cutoffAt,
        totalQuantityRequested: cycle.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        myBid: myBid
          ? {
              id: myBid.id,
              unitPrice: Number(myBid.unitPrice),
              quantityOffered: myBid.quantityOffered,
              estimatedDeliveryDays: myBid.estimatedDeliveryDays,
              status: myBid.status,
            }
          : null,
      };
    });
}

export async function getSellerBids(sellerId: string) {
  const bids = await prisma.bid.findMany({
    where: { sellerId },
    include: { material: true, cycle: true },
    orderBy: { submittedAt: 'desc' },
  });
  return bids.map((bid) => ({ ...bid, unitPrice: Number(bid.unitPrice) }));
}

// Awarded allocations with the pickup/drop-off details a seller needs to
// fulfil them — the fulfillment center each order item routes to.
export async function getSellerAllocations(sellerId: string) {
  const allocations = await prisma.allocation.findMany({
    where: { bid: { sellerId } },
    include: {
      bid: { include: { material: true } },
      orderItem: { include: { fulfillmentCenter: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return allocations;
}
