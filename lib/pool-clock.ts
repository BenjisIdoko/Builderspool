'use client';

import { useEffect, useState } from 'react';
import type { PoolStage } from './pool-stages';

// Live countdown to the next stage of the daily Pool & Save cycle, in Nigerian
// time (WAT, UTC+1, no daylight saving). The stages come from the live
// timeline in Admin > Settings (see lib/pool-stages.ts), never from constants
// here. There is no participation data in this hook: only time and stage.
const WAT_OFFSET_MS = 60 * 60 * 1000;
const DAY_SECONDS = 24 * 3600;

export type PoolClock = {
  /** Index of the stage the countdown is heading to. */
  index: number;
  /** True after the last stage: the countdown is to tomorrow's first stage. */
  tomorrow: boolean;
  hours: number;
  minutes: number;
  seconds: number;
};

function secondsOfDay(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + m * 60;
}

function nextDeadline(now: number, stages: PoolStage[]): PoolClock {
  const wat = new Date(now + WAT_OFFSET_MS);
  const secondsToday = wat.getUTCHours() * 3600 + wat.getUTCMinutes() * 60 + wat.getUTCSeconds();
  const index = stages.findIndex((s) => secondsToday < secondsOfDay(s.time));
  const tomorrow = index === -1;
  const total = tomorrow
    ? DAY_SECONDS - secondsToday + secondsOfDay(stages[0].time)
    : secondsOfDay(stages[index].time) - secondsToday;
  return {
    index: tomorrow ? 0 : index,
    tomorrow,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Live countdown to the next stage. Returns null until the component has
 * mounted (the clock only exists in the browser), so server and first client
 * render match and layout never shifts.
 */
export function usePoolClock(stages: PoolStage[]): PoolClock | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now === null ? null : nextDeadline(now, stages);
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
