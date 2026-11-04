import { prisma } from '../prisma';
import { AllocationStatus, BidStatus, CycleStatus } from '@prisma/client';
import { getSettings, type SettingValues } from '../settings';
import { notifyBidWon, notifyBidLost } from '../notifications';
import { allocateDemand } from './allocate';
import { checkEligibility, scoreBids, type RejectionReason, type ScoringParams, type SellerInput } from './scoring';
import type { CycleCloseReport } from './types';

export function scoringParamsFromSettings(s: SettingValues): ScoringParams {
  return {
    weights: {
      price: Number(s['scoring.priceWeight']),
      performance: Number(s['scoring.performanceWeight']),
      capacity: Number(s['scoring.capacityWeight']),
      delivery: Number(s['scoring.deliveryWeight']),
      geography: Number(s['scoring.geographyWeight']),
      responsiveness: Number(s['scoring.responsivenessWeight']),
    },
    newSupplierNeutralScore: Number(s['scoring.newSupplierNeutralScore']),
    newSupplierMinOrders: Number(s['scoring.newSupplierMinOrders']),
  };
}

// Fulfilled orders per seller — what "new supplier" is measured against.
export async function completedOrderCounts(sellerIds: string[]): Promise<Map<string, number>> {
  const rows = await prisma.allocation.findMany({
    where: { status: AllocationStatus.FULFILLED, bid: { sellerId: { in: sellerIds } } },
    select: { bid: { select: { sellerId: true } } },
  });
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.bid.sellerId, (counts.get(r.bid.sellerId) ?? 0) + 1);
  return counts;
}

/**
 * Sellers who already hold a (non-cancelled) award in this category and zone
 * today — they count toward the cap on winning suppliers per category per zone.
 */
export async function existingWinnerSellerIds(cycle: { id: string; date: Date; region: string | null; material: { category: string } }) {
  const rows = await prisma.allocation.findMany({
    where: {
      status: { not: AllocationStatus.CANCELLED },
      bid: { cycle: { id: { not: cycle.id }, date: cycle.date, region: cycle.region, material: { category: cycle.material.category } } },
    },
    select: { bid: { select: { sellerId: true } } },
  });
  return [...new Set(rows.map((r) => r.bid.sellerId))];
}

/**
 * Scores a cycle's bids and fills its order-item demand rank-first, splitting
 * across sellers when the top bid alone can't cover it (Transfer File 5.5).
 * Ineligible bids are excluded with a reason code; at most
 * `pool.maxWinnersPerCategoryZone` suppliers win in a category and zone; and a
 * pool line with fewer than `pool.minEligibleBidsPerLine` eligible bids isn't
 * awarded at all. If bids run out before demand does, the shortfall stays
 * unfilled for the acceptance/cascade/fallback steps (tick.ts) — a winning bid
 * is never invented.
 */
export async function awardCycle(cycleId: string): Promise<CycleCloseReport> {
  const settings = await getSettings();
  const params = scoringParamsFromSettings(settings);
  const maxWinners = Number(settings['pool.maxWinnersPerCategoryZone']);
  const minEligibleBids = Number(settings['pool.minEligibleBidsPerLine']);

  const cycle = await prisma.bidCycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: { material: { select: { name: true, unit: true, category: true } } },
  });
  const orderItems = await prisma.orderItem.findMany({ where: { bidCycleId: cycleId }, orderBy: { createdAt: 'asc' } });
  const totalQuantityRequested = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const bids = await prisma.bid.findMany({
    where: { cycleId, status: BidStatus.SUBMITTED },
    include: { seller: { include: { sellerProfile: true } } },
  });
  const completed = await completedOrderCounts([...new Set(bids.map((b) => b.sellerId))]);

  const excluded = new Map<string, RejectionReason>();
  const candidates: { bid: (typeof bids)[number] & { unitPriceNumber: number }; seller: SellerInput }[] = [];
  for (const b of bids) {
    const profile = b.seller.sellerProfile;
    const seller: SellerInput = {
      kycStatus: profile?.kycStatus ?? 'NOT_SUBMITTED',
      regionsServed: profile?.regionsServed ?? [],
      trustScore: Number(profile?.trustScore ?? 0),
      completedOrders: completed.get(b.sellerId) ?? 0,
    };
    const reason = checkEligibility(
      { id: b.id, sellerId: b.sellerId, unitPrice: Number(b.unitPrice), quantityOffered: b.quantityOffered, estimatedDeliveryDays: b.estimatedDeliveryDays, submittedAt: b.submittedAt },
      seller,
      cycle.region,
    );
    if (reason) excluded.set(b.id, reason);
    else candidates.push({ bid: { ...b, unitPriceNumber: Number(b.unitPrice) }, seller });
  }

  const belowMin = candidates.length > 0 && candidates.length < minEligibleBids;
  const ranked = belowMin
    ? []
    : scoreBids(
        candidates.map((c) => ({
          bid: { id: c.bid.id, sellerId: c.bid.sellerId, unitPrice: c.bid.unitPriceNumber, quantityOffered: c.bid.quantityOffered, estimatedDeliveryDays: c.bid.estimatedDeliveryDays, submittedAt: c.bid.submittedAt },
          seller: c.seller,
        })),
        totalQuantityRequested,
        params,
        cycle.region,
      );
  if (belowMin) for (const c of candidates) excluded.set(c.bid.id, 'BELOW_MIN_BIDS');

  const plan = allocateDemand(
    orderItems.map((i) => ({ id: i.id, quantity: i.quantity })),
    ranked.map((r) => ({ bidId: r.bid.id, sellerId: r.bid.sellerId, capacity: r.bid.quantityOffered })),
    { maxWinners, existingWinners: await existingWinnerSellerIds(cycle) },
  );
  const totalQuantityAllocated = plan.allocations.reduce((sum, a) => sum + a.quantity, 0);

  await prisma.$transaction(async (tx) => {
    for (const a of plan.allocations) {
      await tx.allocation.create({
        data: {
          bidId: a.bidId,
          orderItemId: a.orderItemId,
          quantityFilled: a.quantity,
          status: AllocationStatus.PENDING,
          acceptDeadlineAt: cycle.acceptDeadlineAt,
          cascadeRound: 0,
        },
      });
    }

    for (const [i, r] of ranked.entries()) {
      const filled = plan.filledByBid.get(r.bid.id) ?? 0;
      await tx.bid.update({
        where: { id: r.bid.id },
        data: {
          score: Math.round(r.score * 100) / 100,
          rank: i + 1,
          rejectionReason: filled === 0 && plan.cappedBidIds.has(r.bid.id) ? 'OVER_WINNER_CAP' : null,
          status:
            filled === 0
              ? BidStatus.REJECTED
              : filled >= r.bid.quantityOffered
                ? BidStatus.FILLED
                : BidStatus.PARTIALLY_FILLED,
        },
      });
    }
    for (const [bidId, reason] of excluded) {
      await tx.bid.update({ where: { id: bidId }, data: { status: BidStatus.REJECTED, rejectionReason: reason } });
    }

    await tx.bidCycle.update({
      where: { id: cycleId },
      data: { status: CycleStatus.AWARDED, awardedAt: new Date() },
    });
  });

  const needsAttention = totalQuantityAllocated < totalQuantityRequested;
  if (needsAttention) {
    console.warn(
      `[bidding] cycle ${cycleId} awarded with unmet demand: ${totalQuantityRequested - totalQuantityAllocated} units unfilled — acceptance, cascade and fallback will handle it`,
    );
  }

  // Every seller who bid finds out whether they won (and how much) or not,
  // after the transaction has actually committed.
  const winnerQuantity = new Map<string, number>();
  for (const a of plan.allocations) winnerQuantity.set(a.sellerId, (winnerQuantity.get(a.sellerId) ?? 0) + a.quantity);
  const sellerIdsWhoBid = [...new Set(bids.map((b) => b.sellerId))];
  await Promise.all(
    sellerIdsWhoBid.map((sellerId) => {
      const qty = winnerQuantity.get(sellerId) ?? 0;
      return qty > 0
        ? notifyBidWon(sellerId, cycle.material.name, qty, cycle.material.unit, cycle.acceptDeadlineAt)
        : notifyBidLost(sellerId, cycle.material.name);
    }),
  );

  return {
    cycleId,
    closedAt: new Date(),
    totalBidsConsidered: ranked.length,
    totalAllocationsCreated: plan.allocations.length,
    totalQuantityRequested,
    totalQuantityAllocated,
    needsAttention,
  };
}
