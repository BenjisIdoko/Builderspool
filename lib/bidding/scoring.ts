import { prisma } from '../prisma';
import type { Bid, BidCycle, SellerProfile } from '@prisma/client';

// Weighted award scoring — not simple lowest-price-wins.
const PRICE_WEIGHT = 0.4;
const TRUST_WEIGHT = 0.25;
const CAPACITY_WEIGHT = 0.2;
const DELIVERY_WEIGHT = 0.15;

export interface EligibleBid {
  bid: Bid;
  sellerProfile: SellerProfile;
}

export interface ScoredBid extends EligibleBid {
  score: number;
}

/**
 * Geography is a hard eligibility filter, not a scored dimension — a seller
 * who doesn't serve a regional cycle's region is excluded before scoring
 * runs at all. A null (national) region has no regional restriction.
 */
export function isSellerEligible(sellerProfile: SellerProfile, cycle: BidCycle): boolean {
  if (!cycle.region) return true;
  return sellerProfile.regionsServed.includes(cycle.region);
}

export async function getEligibleBidsForCycle(cycleId: string) {
  const cycle = await prisma.bidCycle.findUniqueOrThrow({ where: { id: cycleId } });
  const bids = await prisma.bid.findMany({
    where: { cycleId, status: 'SUBMITTED' },
    include: { seller: { include: { sellerProfile: true } } },
  });

  const eligibleBids: EligibleBid[] = [];
  for (const bid of bids) {
    const sellerProfile = bid.seller.sellerProfile;
    if (!sellerProfile) continue; // no trust data to score against — excluded
    if (!isSellerEligible(sellerProfile, cycle)) continue;
    eligibleBids.push({ bid, sellerProfile });
  }

  return { cycle, eligibleBids };
}

/** Price 40% / seller reliability 25% / capacity fit 20% / delivery speed 15%. */
export function scoreBids(eligibleBids: EligibleBid[], totalQuantityNeeded: number): ScoredBid[] {
  if (eligibleBids.length === 0) return [];

  const prices = eligibleBids.map(({ bid }) => Number(bid.unitPrice));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const deliveryDays = eligibleBids.map(({ bid }) => bid.estimatedDeliveryDays);
  const minDelivery = Math.min(...deliveryDays);
  const maxDelivery = Math.max(...deliveryDays);

  return eligibleBids
    .map(({ bid, sellerProfile }) => {
      const priceScore =
        maxPrice === minPrice ? 1 : (maxPrice - Number(bid.unitPrice)) / (maxPrice - minPrice);
      const trustScore = Math.max(0, Math.min(1, sellerProfile.trustScore / 100));
      const capacityScore =
        totalQuantityNeeded > 0 ? Math.max(0, Math.min(1, bid.quantityOffered / totalQuantityNeeded)) : 0;
      const deliveryScore =
        maxDelivery === minDelivery
          ? 1
          : (maxDelivery - bid.estimatedDeliveryDays) / (maxDelivery - minDelivery);

      const score =
        priceScore * PRICE_WEIGHT +
        trustScore * TRUST_WEIGHT +
        capacityScore * CAPACITY_WEIGHT +
        deliveryScore * DELIVERY_WEIGHT;

      return { bid, sellerProfile, score };
    })
    .sort((a, b) => b.score - a.score);
}
