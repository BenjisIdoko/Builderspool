import type { CycleTimes } from './bidding/schedule';

// The buyer-facing view of the daily cycle, built from the live timeline in
// Admin > Settings so the storefront never states a time the engine does not
// use. Three stages are enough for a buyer: demand is frozen, bidding closes
// and winners are chosen, and the final result (anything no supplier can fill
// is refunded). The seller-only accept deadline is not shown.
export type PoolStage = { time: string; label: string; detail: string };

export function buildPoolStages(times: CycleTimes): PoolStage[] {
  return [
    { time: times.poolCloseTime, label: 'Pool closes', detail: 'Orders placed before this join the day’s pool.' },
    { time: times.bidCloseTime, label: 'Winners chosen', detail: 'Verified suppliers bid blind; the best-scoring bid wins.' },
    { time: times.fallbackTime, label: 'Final result', detail: 'Any line no supplier can fill is refunded.' },
  ];
}
