import { formatLagosClock } from '../format';
// The Pool & Save daily timeline (Transfer File 5.4) in Africa/Lagos time.
// Lagos is UTC+1 all year (no daylight saving), so a fixed offset is exact.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CycleTimes {
  poolCloseTime: string; // HH:MM, demand frozen and RFQs issued
  bidCloseTime: string; // HH:MM, blind bidding closes and awards run
  acceptDeadlineTime: string; // HH:MM, unaccepted awards pass to the next bid
  fallbackTime: string; // HH:MM, last step: unfilled lines marked unsuccessful
}

export interface CycleSchedule {
  poolClosesAt: Date;
  bidsCloseAt: Date;
  acceptDeadlineAt: Date;
  fallbackAt: Date;
}

/** The calendar date (YYYY-MM-DD) it currently is in Lagos. */
export function lagosYmd(date: Date): string {
  return new Date(date.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/** "HH:MM" on a Lagos calendar date, as the UTC instant it names. */
export function lagosToUtc(ymd: string, hhmm: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - LAGOS_OFFSET_MS);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Which day's cycle a payment confirmed at `now` belongs to: today's if the
 * pool is still collecting demand, tomorrow's once today's pool has closed.
 */
export function cycleDateFor(now: Date, poolCloseTime: string): string {
  const today = lagosYmd(now);
  return now.getTime() >= lagosToUtc(today, poolCloseTime).getTime() ? addDaysYmd(today, 1) : today;
}

export function buildCycleSchedule(ymd: string, times: CycleTimes): CycleSchedule {
  return {
    poolClosesAt: lagosToUtc(ymd, times.poolCloseTime),
    bidsCloseAt: lagosToUtc(ymd, times.bidCloseTime),
    acceptDeadlineAt: lagosToUtc(ymd, times.acceptDeadlineTime),
    fallbackAt: lagosToUtc(ymd, times.fallbackTime),
  };
}

/** The `date` column value (UTC midnight of the Lagos calendar date). */
export function ymdToDbDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function formatLagosTime(date: Date): string {
  return formatLagosClock(date);
}
