import type { BidCycle, SellerProfile } from '@prisma/client';

// Bid evaluation (Transfer File 5.5), kept free of database access so every
// rule can be tested on plain data. The order is: eligibility (with a reason
// code) -> score -> rank (ties: landed price, then performance, then earliest
// submission) -> award (allocate.ts). Deterministic: the same inputs always
// give the same ranking.

export type RejectionReason =
  | 'NOT_APPROVED' // seller isn't an approved, unsuspended supplier
  | 'OUTSIDE_SERVICE_AREA' // seller doesn't serve a regional cycle's region
  | 'INVALID_BID' // price, quantity or delivery estimate isn't usable
  | 'OVER_WINNER_CAP' // category/zone already has the maximum winning suppliers
  | 'BELOW_MIN_BIDS'; // too few eligible bids to award this pool line

export interface ScoringWeights {
  price: number;
  performance: number;
  capacity: number;
  delivery: number;
  geography: number;
  responsiveness: number;
}

export interface ScoringParams {
  weights: ScoringWeights;
  newSupplierNeutralScore: number; // performance score before enough history
  newSupplierMinOrders: number; // completed orders before history counts
}

export interface BidInput {
  id: string;
  sellerId: string;
  unitPrice: number;
  quantityOffered: number;
  estimatedDeliveryDays: number;
  submittedAt: Date;
}

export interface SellerInput {
  kycStatus: string;
  regionsServed: string[];
  trustScore: number; // 0-100
  completedOrders: number; // fulfilled allocations so far
}

export interface ScoreBreakdown {
  price: number;
  performance: number;
  capacity: number;
  delivery: number;
  geography: number;
  responsiveness: number;
}

export interface ScoredBid<B extends BidInput = BidInput> {
  bid: B;
  seller: SellerInput;
  breakdown: ScoreBreakdown;
  score: number; // 0-100
}

/**
 * Hard eligibility, as a reason code (null = eligible). Only prequalified
 * suppliers (KYC approved, not suspended) take part, and a regional cycle only
 * admits sellers who serve that region. A null (national) region has no
 * regional restriction.
 */
export function checkEligibility(bid: BidInput, seller: SellerInput, cycleRegion: string | null): RejectionReason | null {
  if (seller.kycStatus !== 'APPROVED') return 'NOT_APPROVED';
  if (!(bid.unitPrice > 0) || !(bid.quantityOffered > 0) || !(bid.estimatedDeliveryDays >= 0)) return 'INVALID_BID';
  if (cycleRegion && !seller.regionsServed.includes(cycleRegion)) return 'OUTSIDE_SERVICE_AREA';
  return null;
}

/** What a seller may see and bid on — the same rule, minus per-bid checks. */
export function isSellerEligible(sellerProfile: SellerProfile, cycle: Pick<BidCycle, 'region'>): boolean {
  if (sellerProfile.kycStatus !== 'APPROVED') return false;
  if (!cycle.region) return true;
  return sellerProfile.regionsServed.includes(cycle.region);
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Inverse min-max: lowest value scores 100, highest 0, all equal scores 100.
function lowerIsBetter(value: number, min: number, max: number): number {
  return max === min ? 100 : ((max - value) / (max - min)) * 100;
}

export function scoreBids<B extends BidInput>(
  candidates: { bid: B; seller: SellerInput }[],
  totalQuantityNeeded: number,
  params: ScoringParams,
  cycleRegion: string | null,
): ScoredBid<B>[] {
  if (candidates.length === 0) return [];

  // Landed price today is the unit price: delivery is a platform charge, not
  // part of a seller's bid, until sellers quote delivery themselves.
  const prices = candidates.map(({ bid }) => bid.unitPrice);
  const days = candidates.map(({ bid }) => bid.estimatedDeliveryDays);
  const [minPrice, maxPrice] = [Math.min(...prices), Math.max(...prices)];
  const [minDays, maxDays] = [Math.min(...days), Math.max(...days)];
  const w = params.weights;
  const weightTotal = w.price + w.performance + w.capacity + w.delivery + w.geography + w.responsiveness || 100;

  const scored = candidates.map(({ bid, seller }) => {
    const breakdown: ScoreBreakdown = {
      price: lowerIsBetter(bid.unitPrice, minPrice, maxPrice),
      performance:
        seller.completedOrders >= params.newSupplierMinOrders ? clamp(seller.trustScore) : params.newSupplierNeutralScore,
      capacity: totalQuantityNeeded > 0 ? clamp((bid.quantityOffered / totalQuantityNeeded) * 100) : 0,
      delivery: lowerIsBetter(bid.estimatedDeliveryDays, minDays, maxDays),
      // Placeholder until delivery zones exist (catalogue phase): an eligible
      // bid already serves the region, so it is the "same zone" case.
      geography: cycleRegion === null || seller.regionsServed.includes(cycleRegion) ? 100 : 0,
      // A bid can't be submitted without price, quantity and delivery days, so
      // every bid is complete today; kept as a scored line for when bids gain
      // optional fields (notes, substitution terms).
      responsiveness: 100,
    };
    const score =
      (breakdown.price * w.price +
        breakdown.performance * w.performance +
        breakdown.capacity * w.capacity +
        breakdown.delivery * w.delivery +
        breakdown.geography * w.geography +
        breakdown.responsiveness * w.responsiveness) /
      weightTotal;
    return { bid, seller, breakdown, score };
  });

  return scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.bid.unitPrice - b.bid.unitPrice ||
      b.breakdown.performance - a.breakdown.performance ||
      a.bid.submittedAt.getTime() - b.bid.submittedAt.getTime() ||
      a.bid.id.localeCompare(b.bid.id),
  );
}
