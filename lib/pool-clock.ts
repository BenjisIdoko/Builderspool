'use client';

import { useEffect, useState } from 'react';

// The daily Pool & Save cycle, driven by the real clock in Nigeria (WAT,
// UTC+1, no daylight saving). Stage times are the ones published on the
// storefront: pool closes 12:00, bids close 16:00, winners 17:00. There is no
// participation data to show yet, so this only reports time and stage.
const WAT_OFFSET_MS = 60 * 60 * 1000;

export const POOL_STAGES = [
  { hour: 12, label: 'Pool closes', detail: 'Join, change or withdraw until then.' },
  { hour: 16, label: 'Bids close', detail: 'Verified suppliers bid blind.' },
  { hour: 17, label: 'Winners announced', detail: 'Best bid wins. No winner, no charge.' },
] as const;

export type PoolClock = {
  /** Index of the stage the countdown is heading to. */
  index: number;
  /** True after the last stage: the countdown is to tomorrow's first stage. */
  tomorrow: boolean;
  hours: number;
  minutes: number;
  seconds: number;
};

function nextDeadline(now: number): PoolClock {
  const wat = new Date(now + WAT_OFFSET_MS);
  const secondsToday = wat.getUTCHours() * 3600 + wat.getUTCMinutes() * 60 + wat.getUTCSeconds();
  const index = POOL_STAGES.findIndex((s) => secondsToday < s.hour * 3600);
  const tomorrow = index === -1;
  const total = tomorrow
    ? 24 * 3600 - secondsToday + POOL_STAGES[0].hour * 3600
    : POOL_STAGES[index].hour * 3600 - secondsToday;
  return {
    index: tomorrow ? 0 : index,
    tomorrow,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Live countdown to the next pool deadline. Returns null until the component
 * has mounted (the clock only exists in the browser), so server and first
 * client render match and layout never shifts.
 */
export function usePoolClock(): PoolClock | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now === null ? null : nextDeadline(now);
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
