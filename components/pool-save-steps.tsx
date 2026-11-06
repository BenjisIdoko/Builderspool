import { REVEAL_STAGGER, Reveal } from '@/components/motion/reveal';
import type { CycleTimes } from '@/lib/bidding/schedule';

// "How Pool & Save works" — four numbered steps in one row on a pale-blue
// band. Times come from the live timeline in Admin > Settings; the steps
// describe this platform's flow (fixed catalogue price now, savings shared
// after delivery is confirmed). Typographic on purpose: the numerals carry
// the rhythm until there is photography for each step.
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
      title: 'Suppliers bid blind',
      body: `Until ${times.bidCloseTime}, without seeing each other’s prices. Bids are scored on price, performance, capacity and delivery.`,
    },
    {
      title: 'Best bid wins, you save',
      body: 'If the winning bid costs less than the catalogue price, you keep 50% of the saving in your savings wallet once delivery is confirmed.',
    },
  ];
}

export function PoolSaveSteps({ times }: { times: CycleTimes }) {
  const steps = buildSteps(times);
  return (
    <div className="mx-auto w-full max-w-section py-section">
      <h2 className="text-heading-lg text-ink">How Pool &amp; Save works</h2>
      <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * REVEAL_STAGGER} className="h-full border-t-2 border-cyan-text pt-4">
              <span className="font-mono text-figure-lg text-cyan-text">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-heading-sm text-ink">{step.title}</h3>
              <p className="mt-2 max-w-[34ch] text-body-sm text-slate">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
