import { getSettings, type SettingValues } from '@/lib/settings';
import type { CycleTimes } from './schedule';

// The timeline a buyer's order will actually run on, so the storefront never states a time
// the engine does not use. Orders only join a category sheet when the sheet engine is on AND
// the area picker is on (that is what gives an order a zone); otherwise they pool per
// material on the older cycle times.
export interface BuyerTimes {
  times: CycleTimes;
  /** True when buyers' orders run on category sheets. */
  sheets: boolean;
}

const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmmOf = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function buyerTimesFromSettings(s: SettingValues): BuyerTimes {
  const sheets = s['sheets.enabled'] === true && s['areas.checkoutPickerEnabled'] === true;
  if (!sheets) {
    return {
      sheets: false,
      times: {
        poolCloseTime: String(s['cycle.poolCloseTime']),
        bidCloseTime: String(s['cycle.bidCloseTime']),
        acceptDeadlineTime: String(s['cycle.acceptDeadlineTime']),
        fallbackTime: String(s['cycle.fallbackTime']),
      },
    };
  }
  const bidClose = String(s['sheets.bidCloseTime']);
  return {
    sheets: true,
    times: {
      poolCloseTime: String(s['sheets.poolCloseTime']),
      bidCloseTime: bidClose,
      // The first ranked vendor's window ends one accept window after bids close.
      acceptDeadlineTime: hhmmOf(minutesOf(bidClose) + Number(s['sheets.acceptWindowMinutes'])),
      fallbackTime: String(s['sheets.finalTime']),
    },
  };
}

export async function getBuyerFacingTimes(): Promise<BuyerTimes> {
  return buyerTimesFromSettings(await getSettings());
}
