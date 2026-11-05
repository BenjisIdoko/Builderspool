'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UsersThreeIcon } from '@phosphor-icons/react/ssr';

// The daily Pool & Save cycle, driven by the real clock in Nigeria (WAT,
// UTC+1, no daylight saving). Stage times are the ones published on the
// storefront: pool closes 12:00, bids close 16:00, winners 17:00. This shows
// no participation numbers — there is no live pool data to show yet.
const WAT_OFFSET_MS = 60 * 60 * 1000;
const STAGES = [
  { hour: 12, label: 'Pool closes', detail: 'Join, change or withdraw until then.' },
  { hour: 16, label: 'Bids close', detail: 'Verified suppliers bid blind.' },
  { hour: 17, label: 'Winners announced', detail: 'Best bid wins. No winner, no charge.' },
] as const;

function nextDeadline(now: number) {
  const wat = new Date(now + WAT_OFFSET_MS);
  const secondsToday = wat.getUTCHours() * 3600 + wat.getUTCMinutes() * 60 + wat.getUTCSeconds();
  const index = STAGES.findIndex((s) => secondsToday < s.hour * 3600);
  if (index === -1) {
    // After 17:00: the next pool closes at 12:00 tomorrow.
    return { index: 0, seconds: 24 * 3600 - secondsToday + STAGES[0].hour * 3600, tomorrow: true };
  }
  return { index, seconds: STAGES[index].hour * 3600 - secondsToday, tomorrow: false };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function PoolModule() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // The clock only exists in the browser, so the countdown starts after
    // mount (server and first client render both show the placeholder).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deadline = now === null ? null : nextDeadline(now);
  const h = deadline ? Math.floor(deadline.seconds / 3600) : 0;
  const m = deadline ? Math.floor((deadline.seconds % 3600) / 60) : 0;
  const s = deadline ? deadline.seconds % 60 : 0;

  return (
    <section
      id="pool"
      aria-label="Today's Pool & Save"
      className="mx-auto w-full max-w-section scroll-mt-40 px-3 pt-3 sm:px-0"
    >
      <div className="grid gap-4 rounded-md bg-pale-blue p-4 sm:p-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-center lg:gap-8">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] font-bold tracking-[0.06em] text-cyan-text uppercase">
            <UsersThreeIcon weight="fill" className="size-4" />
            Today’s Pool &amp; Save
          </div>
          <div className="mt-2 text-sm text-slate">
            {deadline === null
              ? 'Pool closes at 12:00'
              : `${deadline.tomorrow ? 'Tomorrow’s pool closes' : `${STAGES[deadline.index].label} in`}`}
          </div>
          <div
            className="font-mono text-figure-xl text-ink tabular-nums"
            aria-live="off"
          >
            {deadline === null ? '--:--:--' : `${pad(h)}:${pad(m)}:${pad(s)}`}
          </div>
          <Link
            href="/catalog"
            className="mt-3 inline-flex min-h-11 items-center rounded-md bg-cta px-5 text-sm font-bold text-white hover:bg-cta-hover"
          >
            {deadline?.tomorrow ? 'Join tomorrow’s pool' : 'Join today’s pool'}
          </Link>
        </div>

        <ol className="grid gap-2 sm:grid-cols-3">
          {STAGES.map((stage, i) => {
            const active = deadline !== null && !deadline.tomorrow && i === deadline.index;
            const done = deadline !== null && !deadline.tomorrow && i < deadline.index;
            return (
              <li
                key={stage.label}
                aria-current={active ? 'step' : undefined}
                className={`rounded-md p-3 ${active ? 'bg-ink text-white' : 'bg-surface text-ink'} ${
                  done ? 'opacity-60' : ''
                }`}
              >
                <div
                  className={`font-mono text-figure tabular-nums ${active ? 'text-white' : 'text-cyan-text'}`}
                >
                  {pad(stage.hour)}:00
                </div>
                <div className="text-sm font-bold">{stage.label}</div>
                <div className={`mt-0.5 text-[13px] ${active ? 'text-white/80' : 'text-slate'}`}>{stage.detail}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
