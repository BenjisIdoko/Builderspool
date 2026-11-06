'use client';

import { pad2, usePoolClock } from '@/lib/pool-clock';
import type { PoolStage } from '@/lib/pool-stages';

// The live pool, as a bar along the bottom of the hero: a real countdown to the
// next deadline and where today's cycle is right now. Stage times come from the
// live timeline in Admin > Settings. It states no participant counts or
// prices — only time and stage.
export function HeroPoolBar({ stages }: { stages: PoolStage[] }) {
  const clock = usePoolClock(stages);

  const heading =
    clock === null
      ? `${stages[0].label} in`
      : clock.tomorrow
        ? 'Tomorrow’s pool closes in'
        : `${stages[clock.index].label} in`;

  return (
    <div
      id="pool"
      aria-label="Today’s Pool & Save"
      className="mt-10 grid scroll-mt-40 grid-cols-3 gap-px overflow-hidden rounded-t-panel bg-on-navy-line md:grid-cols-[1.2fr_1fr_1fr_1fr]"
    >
      <div className="col-span-3 bg-navy-raised/95 p-4 md:col-span-1">
        <div className="text-label uppercase text-cyan">{heading}</div>
        <div className="font-mono text-figure-lg tabular-nums" aria-live="off">
          {clock === null ? '--:--:--' : `${pad2(clock.hours)}:${pad2(clock.minutes)}:${pad2(clock.seconds)}`}
        </div>
      </div>
      {stages.map((stage, i) => {
        const active = clock !== null && !clock.tomorrow && i === clock.index;
        return (
          <div
            key={stage.label}
            aria-current={active ? 'step' : undefined}
            className={`p-3 md:p-4 ${active ? 'bg-white text-ink' : 'bg-navy-raised/95 text-on-navy-muted'}`}
          >
            <div className="font-mono text-figure tabular-nums">{stage.time}</div>
            <div className="text-body-sm font-bold">{stage.label}</div>
          </div>
        );
      })}
    </div>
  );
}
