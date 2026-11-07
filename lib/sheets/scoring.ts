import type { ScoreCriterion } from '@prisma/client';

// Six-criterion scoring of a sheet bid (docs/floot-port-notes.md 1c), kept free of
// database access so every rule can be tested on plain data. Each criterion gets a
// 0 to 100 score, is weighted by the Admin > Settings weights (which add up to
// 100), and keeps a one-line reason. The same inputs always give the same ranking.

export interface SheetScoringParams {
  weights: Record<ScoreCriterion, number>;
  newSupplierNeutralScore: number;
  newSupplierMinOrders: number;
}

// A vendor with approved cover for the zone scores 100; one who supplies the whole
// country without zone-specific approval scores this much for geography.
export const NATIONAL_SUPPLY_GEOGRAPHY_SCORE = 70;

export interface SheetScoreCandidate {
  bidId: string;
  totalAmount: number;
  submittedAt: Date;
  completedOrders: number;
  trustScore: number; // 0 to 100
  // Per sheet line, the vendor's live stock for that item (0 if they list none).
  stockCover: { stock: number; needed: number }[];
  // Longest lead time across the vendor's live listings for the sheet's items; null if none.
  leadTimeDays: number | null;
  geography: 'ZONE' | 'NATIONAL';
}

export interface CriterionScore {
  criterion: ScoreCriterion;
  weight: number;
  points: number; // 0 to weight, 2 decimals
  reason: string;
}

export interface ScoredSheetBid {
  candidate: SheetScoreCandidate;
  rows: CriterionScore[];
  total: number; // sum of the points above
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

// Lowest value scores 100, highest 0, all equal scores 100.
function lowerIsBetter(value: number, min: number, max: number): number {
  return max === min ? 100 : ((max - value) / (max - min)) * 100;
}

export function scoreSheetBids(candidates: SheetScoreCandidate[], params: SheetScoringParams, window: { opensAt: Date; closesAt: Date }): ScoredSheetBid[] {
  if (candidates.length === 0) return [];
  const n = candidates.length;
  const w = params.weights;

  const amounts = candidates.map((c) => c.totalAmount);
  const [minAmount, maxAmount] = [Math.min(...amounts), Math.max(...amounts)];
  const days = candidates.map((c) => c.leadTimeDays).filter((d): d is number => d !== null);
  const [minDays, maxDays] = days.length ? [Math.min(...days), Math.max(...days)] : [0, 0];
  const windowMs = Math.max(1, window.closesAt.getTime() - window.opensAt.getTime());

  const scored = candidates.map((c) => {
    const raw: { criterion: ScoreCriterion; score: number; reason: string }[] = [];

    raw.push({
      criterion: 'PRICE',
      score: lowerIsBetter(c.totalAmount, minAmount, maxAmount),
      reason:
        n === 1
          ? 'Only eligible bid, so it scores full marks on price'
          : c.totalAmount === minAmount
            ? `Lowest price of ${n} eligible bids (${naira(c.totalAmount)})`
            : `${naira(c.totalAmount - minAmount)} above the lowest of ${n} eligible bids`,
    });

    const experienced = c.completedOrders >= params.newSupplierMinOrders;
    raw.push({
      criterion: 'PERFORMANCE',
      score: experienced ? clamp(c.trustScore) : params.newSupplierNeutralScore,
      reason: experienced
        ? `${c.completedOrders} completed orders, trust score ${Math.round(clamp(c.trustScore))}`
        : `New supplier (${c.completedOrders} of ${params.newSupplierMinOrders} completed orders): neutral ${params.newSupplierNeutralScore}`,
    });

    const covers = c.stockCover.map((l) => (l.needed > 0 ? Math.min(l.stock / l.needed, 1) : 1));
    const full = covers.filter((x) => x >= 1).length;
    raw.push({
      criterion: 'CAPACITY',
      score: covers.length ? (covers.reduce((a, b) => a + b, 0) / covers.length) * 100 : 0,
      reason: covers.length
        ? `Stock covers ${full} of ${covers.length} items in full (average cover ${Math.round((covers.reduce((a, b) => a + b, 0) / covers.length) * 100)}%)`
        : 'No items to compare',
    });

    raw.push({
      criterion: 'DELIVERY',
      score: c.leadTimeDays === null ? 0 : lowerIsBetter(c.leadTimeDays, minDays, maxDays),
      reason: c.leadTimeDays === null ? 'No live listings to show a lead time' : `Slowest listed lead time ${c.leadTimeDays} ${c.leadTimeDays === 1 ? 'day' : 'days'}`,
    });

    raw.push({
      criterion: 'GEOGRAPHY',
      score: c.geography === 'ZONE' ? 100 : NATIONAL_SUPPLY_GEOGRAPHY_SCORE,
      reason: c.geography === 'ZONE' ? 'Approved to supply this delivery zone' : 'National supply, not approved for this zone specifically',
    });

    const left = clamp((window.closesAt.getTime() - c.submittedAt.getTime()) / windowMs, 0, 1);
    const minutesIn = Math.max(0, Math.round((c.submittedAt.getTime() - window.opensAt.getTime()) / 60_000));
    raw.push({
      criterion: 'RESPONSIVENESS',
      score: left * 100,
      reason: `Sent ${minutesIn} min after bidding opened (${Math.round(left * 100)}% of the window left)`,
    });

    const rows: CriterionScore[] = raw.map((r) => ({ criterion: r.criterion, weight: w[r.criterion], points: round2((r.score * w[r.criterion]) / 100), reason: r.reason }));
    return { candidate: c, rows, total: round2(rows.reduce((sum, r) => sum + r.points, 0)) };
  });

  // Ties: lower total price, then higher performance points, then earlier submission.
  const perf = (s: ScoredSheetBid) => s.rows.find((r) => r.criterion === 'PERFORMANCE')!.points;
  return scored.sort(
    (a, b) =>
      b.total - a.total ||
      a.candidate.totalAmount - b.candidate.totalAmount ||
      perf(b) - perf(a) ||
      a.candidate.submittedAt.getTime() - b.candidate.submittedAt.getTime() ||
      a.candidate.bidId.localeCompare(b.candidate.bidId),
  );
}
