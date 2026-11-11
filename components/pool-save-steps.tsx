import Image from 'next/image';
import { REVEAL_STAGGER, Reveal } from '@/components/motion/reveal';
import type { CycleTimes } from '@/lib/bidding/schedule';
import { SAVINGS_TIMING_TEXT } from '@/lib/pool-stages';

// "How Pool & Save works" — four numbered steps in one row on a pale-blue
// band. Times come from the live timeline in Admin > Settings; the steps
// describe this platform's flow (fixed catalogue price now, savings shared
// after delivery is confirmed). Typographic on purpose: the numerals carry
// the rhythm until there is photography for each step.
// Each step shows one crop of the Ushafa warehouse picture (one file, four
// framings: stock on pallets, full racks, the benefits banners, a truck being
// unloaded). `origin` is where the crop is centred, in % of the source image.
const STEP_CROPS = [
  { origin: '14% 82%', scale: 2.4 },
  { origin: '48% 36%', scale: 2.2 },
  { origin: '82% 20%', scale: 2.6 },
  { origin: '90% 52%', scale: 2.6 },
] as const;

function StepPhoto({ index }: { index: number }) {
  const crop = STEP_CROPS[index];
  return (
    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-card bg-well outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
      <Image
        src="/hero/warehouse.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"
        className="object-cover"
        style={{ transform: `scale(${crop.scale})`, transformOrigin: crop.origin }}
      />
    </div>
  );
}

function buildSteps(times: CycleTimes) {
  return [
    {
      title: 'Order at the catalogue price',
      body: `Pay the fixed catalogue price. Orders placed before ${times.poolCloseTime} join today’s pool.`,
    },
    {
      title: 'Demand is pooled',
      body: `At ${times.poolCloseTime} the day’s orders are frozen and sent to verified suppliers as one request.`,
    },
    {
      title: 'Suppliers compete',
      body: `Verified suppliers offer to fill the pool for less. Your result is ready by ${times.fallbackTime}.`,
    },
    {
      title: 'Best price wins, you save',
      body: 'If the winning price is lower than the catalogue price, you keep 50% of the saving in your savings wallet ' + SAVINGS_TIMING_TEXT + '.',
    },
  ];
}

export function PoolSaveSteps({ times }: { times: CycleTimes }) {
  const steps = buildSteps(times);
  return (
    <div className="mx-auto w-full max-w-section pt-section pb-section-loose">
      <h2 className="text-heading-lg text-ink">How Pool &amp; Save works</h2>
      <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * REVEAL_STAGGER} className="h-full">
              <StepPhoto index={i} />
              <div className="border-t-2 border-cyan-text pt-4">
              <span className="font-mono text-figure-lg text-cyan-text">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-heading-sm text-ink">{step.title}</h3>
              <p className="mt-2 max-w-[34ch] text-pretty text-body-sm text-slate">{step.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
