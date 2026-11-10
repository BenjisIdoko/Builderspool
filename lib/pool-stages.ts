import { cycleDateFor, lagosYmd, type CycleTimes } from './bidding/schedule';

// The buyer-facing view of the daily cycle, built from the live timeline in
// Admin > Settings so the storefront never states a time the engine does not
// use. Three stages are enough for a buyer: demand is frozen, bidding closes
// and winners are chosen, and the final result (anything no supplier can fill
// goes back to the seller the buyer chose, or is refunded). The seller-only accept deadline is not shown.
export type PoolStage = { time: string; label: string; detail: string };

export function buildPoolStages(times: CycleTimes, sheets = false): PoolStage[] {
  if (sheets) {
    return [
      { time: times.poolCloseTime, label: 'Pool closes', detail: 'Orders placed before this join the day’s pool for your area.' },
      { time: times.bidCloseTime, label: 'Bids close', detail: 'Verified suppliers bid blind; the best-scoring bids are offered the pool in turn.' },
      { time: times.fallbackTime, label: 'Final result', detail: 'If no supplier takes the pool, your order goes to the seller you chose, or is refunded.' },
    ];
  }
  return [
    { time: times.poolCloseTime, label: 'Pool closes', detail: 'Orders placed before this join the day’s pool.' },
    { time: times.bidCloseTime, label: 'Winners chosen', detail: 'Verified suppliers bid blind; the best-scoring bid wins.' },
    { time: times.fallbackTime, label: 'Final result', detail: 'If no supplier takes the pool, your order goes to the seller you chose, or is refunded.' },
  ];
}

/** What happens if no supplier takes the pool: the founder's rule (docs/floot-port-notes.md 1c). */
export function refundRuleText(): string {
  return 'If no supplier takes the pool, your order goes to the seller you chose, at the price you paid. If that seller cannot supply it, you are refunded.';
}

/**
 * True once today's pool has closed (Lagos time), so an order placed now joins
 * tomorrow's pool. Uses the same rule the engine uses to pick an order's cycle.
 */
export function isPoolClosedForToday(times: CycleTimes, now: Date = new Date()): boolean {
  return cycleDateFor(now, times.poolCloseTime) !== lagosYmd(now);
}
