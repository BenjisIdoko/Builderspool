import { cycleDateFor, lagosYmd, type CycleTimes } from './bidding/schedule';

// The buyer-facing view of the daily cycle, built from the live timeline in
// Admin > Settings so the storefront never states a time the engine does not
// use. Two stages are enough for a buyer: the pool closes, and the final result
// (anything no supplier takes goes back to the seller the buyer picked, or is
// refunded). Supplier-side steps (bidding, scoring, ranks) are not shown. The seller-only accept deadline is not shown.
export type PoolStage = { time: string; label: string; detail: string };

export function buildPoolStages(times: CycleTimes, sheets = false): PoolStage[] {
  if (sheets) {
    return [
      { time: times.poolCloseTime, label: 'Pool closes', detail: 'Orders placed before this join the day’s pool for your area.' },
      { time: times.fallbackTime, label: 'Final result', detail: 'A supplier is confirmed for your order. If none takes the pool, it goes to the seller you picked, or is refunded.' },
    ];
  }
  return [
    { time: times.poolCloseTime, label: 'Pool closes', detail: 'Orders placed before this join the day’s pool.' },
    { time: times.fallbackTime, label: 'Final result', detail: 'A supplier is confirmed for your order. If none takes the pool, it goes to the seller you picked, or is refunded.' },
  ];
}

/** What happens if no supplier takes the pool: the founder's rule (docs/floot-port-notes.md 1c). */
export function refundRuleText(everyItemHasSeller = true): string {
  if (!everyItemHasSeller) {
    return 'If no supplier takes the pool, an item with a seller picked goes to that seller at the price you paid; an item with no seller picked is refunded. If a picked seller cannot supply it, you are refunded.';
  }
  return 'If no supplier takes the pool, your order goes to the seller you picked, at the price you paid. If that seller cannot supply it, you are refunded.';
}

/** When the saving reaches the wallet: when our centre issues the goods-received note (lib/fulfillment/grn.ts, lib/sheets/fulfil.ts), not on buyer confirmation. */
export const SAVINGS_TIMING_TEXT = 'once we have received and checked your order at our fulfilment centre';

/**
 * True once today's pool has closed (Lagos time), so an order placed now joins
 * tomorrow's pool. Uses the same rule the engine uses to pick an order's cycle.
 */
export function isPoolClosedForToday(times: CycleTimes, now: Date = new Date()): boolean {
  return cycleDateFor(now, times.poolCloseTime) !== lagosYmd(now);
}
