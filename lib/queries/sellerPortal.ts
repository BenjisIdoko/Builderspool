import { prisma } from '../prisma';
import { BidStatus, CycleStatus, type PayoutStatus } from '@prisma/client';
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
    // OPEN cycles are still collecting demand (sellers can see them, not bid);
    // BIDDING cycles have frozen and issued the RFQ.
    where: { status: { in: [CycleStatus.OPEN, CycleStatus.BIDDING] } },
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

  const now = new Date();
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
        status: cycle.status,
        poolClosesAt: cycle.poolClosesAt,
        bidsCloseAt: cycle.bidsCloseAt ?? cycle.cutoffAt,
        canBid: cycle.status === CycleStatus.BIDDING && now.getTime() < (cycle.bidsCloseAt ?? cycle.cutoffAt).getTime(),
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
export type SellerPayout = {
  id: string;
  source: 'POOL' | 'DIRECT' | 'RFQ';
  materialName: string;
  amount: number;
  status: PayoutStatus;
  reference: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

// Everything the seller is owed or has been paid, from all three ways of selling:
// per-product pool bids, Buy Direct lines and RFQ awards. A Buy Direct line the
// seller declined or let lapse, and an RFQ line ops marked as not supplied, pay
// nothing, so they are left out.
export async function getSellerPayouts(sellerId: string): Promise<SellerPayout[]> {
  const [allocations, direct, sheet] = await Promise.all([
    prisma.allocation.findMany({ where: { bid: { sellerId } }, include: { bid: { include: { material: { select: { name: true } } } } } }),
    prisma.directFulfilment.findMany({
      where: { sellerId, status: { in: ['ACCEPTED', 'FULFILLED'] } },
      include: { orderItem: { select: { material: { select: { name: true } } } } },
    }),
    prisma.sheetFulfilment.findMany({
      where: { sellerId, status: { not: 'FAILED' } },
      include: { orderItem: { select: { material: { select: { name: true } } } } },
    }),
  ]);

  const rows: SellerPayout[] = [
    ...allocations.map((a) => ({
      id: a.id,
      source: 'POOL' as const,
      materialName: a.bid.material.name,
      amount: Number(a.bid.unitPrice) * a.quantityFilled,
      status: a.payoutStatus,
      reference: a.payoutReference,
      paidAt: a.paidAt,
      createdAt: a.createdAt,
    })),
    ...direct.map((d) => ({
      id: d.id,
      source: 'DIRECT' as const,
      materialName: d.orderItem.material.name,
      amount: Number(d.unitPrice) * d.quantity,
      status: d.payoutStatus,
      reference: d.payoutReference,
      paidAt: d.paidAt,
      createdAt: d.createdAt,
    })),
    ...sheet.map((f) => ({
      id: f.id,
      source: 'RFQ' as const,
      materialName: f.orderItem.material.name,
      amount: Number(f.unitPrice) * f.quantity,
      status: f.payoutStatus,
      reference: f.payoutReference,
      paidAt: f.paidAt,
      createdAt: f.createdAt,
    })),
  ];
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getSellerAllocations(sellerId: string) {
  const allocations = await prisma.allocation.findMany({
    where: { bid: { sellerId } },
    include: {
      bid: { include: { material: true } },
      orderItem: { include: { fulfillmentCenter: true, order: { include: { buyer: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return allocations;
}
