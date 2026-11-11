import type { CycleTimes } from '@/lib/bidding/schedule';
import { formatClock } from '@/lib/format';
import { HowItWorks, type HowItWorksStep } from '@/components/ui/how-it-works';

// "How Pool & Save works": four pinned-note steps (see components/ui/how-it-works.tsx). Times come
// from the live timeline in Admin > Settings; the steps describe this platform's flow (fixed
// catalogue price now, half of any saving credited once we have checked the order).
function buildSteps(times: CycleTimes): HowItWorksStep[] {
  return [
    {
      title: 'Order at the catalogue price',
      description: `Pay the fixed price now. Orders placed before ${formatClock(times.poolCloseTime)} join today’s pool.`,
      theme: 'orange',
    },
    {
      title: 'Your order joins the pool',
      description: `At ${formatClock(times.poolCloseTime)} the pool closes and goes to verified suppliers as one request.`,
      theme: 'blue',
    },
    {
      title: 'Suppliers compete',
      description: `Verified suppliers offer to fill the pool for less. Your result is ready by ${formatClock(times.fallbackTime)}.`,
      theme: 'slate',
    },
    {
      title: 'You keep half the saving',
      description: 'If suppliers beat the catalogue price, half the saving goes to your wallet once we’ve checked your order.',
      theme: 'green',
    },
  ];
}

export function PoolSaveSteps({ times }: { times: CycleTimes }) {
  return (
    <div className="mx-auto w-full max-w-section pt-section pb-section-loose">
      <h2 className="text-heading-lg text-ink">How Pool &amp; Save works</h2>
      <HowItWorks steps={buildSteps(times)} className="mt-8" />
    </div>
  );
}
