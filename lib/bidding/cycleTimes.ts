import { getSettings } from '@/lib/settings';
import type { CycleTimes } from './schedule';

// The live timeline from Admin > Settings.
export async function getCycleTimes(): Promise<CycleTimes> {
  const s = await getSettings();
  return {
    poolCloseTime: String(s['cycle.poolCloseTime']),
    bidCloseTime: String(s['cycle.bidCloseTime']),
    acceptDeadlineTime: String(s['cycle.acceptDeadlineTime']),
    fallbackTime: String(s['cycle.fallbackTime']),
  };
}
