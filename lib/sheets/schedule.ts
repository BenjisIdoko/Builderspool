import { getSettings } from '@/lib/settings';
import { lagosToUtc } from '@/lib/bidding/schedule';

// The category-sheet day in Africa/Lagos time: pool closes, bids close, then
// three one-window accept steps (rank 1, 2, 3). Validated in Admin > Settings
// so the last window ends exactly on the final result time.
export interface SheetTimes {
  poolCloseTime: string; // HH:MM
  bidCloseTime: string; // HH:MM
  acceptWindowMinutes: number;
  finalTime: string; // HH:MM
}

export interface SheetSchedule {
  poolClosesAt: Date;
  bidsCloseAt: Date;
  rank1EndsAt: Date;
  rank2EndsAt: Date;
  rank3EndsAt: Date;
}

export async function getSheetTimes(): Promise<SheetTimes> {
  const s = await getSettings();
  return {
    poolCloseTime: String(s['sheets.poolCloseTime']),
    bidCloseTime: String(s['sheets.bidCloseTime']),
    acceptWindowMinutes: Number(s['sheets.acceptWindowMinutes']),
    finalTime: String(s['sheets.finalTime']),
  };
}

export async function isSheetEngineOn(): Promise<boolean> {
  return (await getSettings())['sheets.enabled'] === true;
}

export function buildSheetSchedule(ymd: string, times: SheetTimes): SheetSchedule {
  const bidsCloseAt = lagosToUtc(ymd, times.bidCloseTime);
  const window = times.acceptWindowMinutes * 60_000;
  return {
    poolClosesAt: lagosToUtc(ymd, times.poolCloseTime),
    bidsCloseAt,
    rank1EndsAt: new Date(bidsCloseAt.getTime() + window),
    rank2EndsAt: new Date(bidsCloseAt.getTime() + 2 * window),
    rank3EndsAt: new Date(bidsCloseAt.getTime() + 3 * window),
  };
}
