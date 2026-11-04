// Money convention (BuildersPool Transfer File, section 4): new money values
// are integer kobo, never floats. Legacy columns are still Decimal(12,2) naira
// and move to kobo with the Phase 2 ledger — these helpers are the bridge.
export const KOBO_PER_NAIRA = 100;

export function nairaToKobo(naira: number | string | { toString(): string }): number {
  const n = Number(naira.toString());
  if (!Number.isFinite(n)) throw new Error('Not a valid amount.');
  return Math.round(n * KOBO_PER_NAIRA);
}

export function koboToNaira(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

// Splits an amount into two shares by percentage in whole kobo; any odd kobo
// goes to the first share (spec: "remainder kobo goes to the buyer").
export function splitKobo(totalKobo: number, firstSharePct: number): { first: number; second: number } {
  const second = Math.floor((totalKobo * (100 - firstSharePct)) / 100);
  return { first: totalKobo - second, second };
}
