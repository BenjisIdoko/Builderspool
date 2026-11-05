// "How Pool & Save works" — four numbered steps, copy as on the Floot site.
const STEPS = [
  {
    title: 'Join the pool',
    body: 'Pick a product, quantity and site. Change or withdraw until 12:00.',
  },
  {
    title: 'We lock a price to beat',
    body: 'At 12:00, today’s lowest Buy Direct price in your area becomes the benchmark.',
  },
  {
    title: 'Suppliers bid blind',
    body: 'Up to 5 verified suppliers per category bid until 16:00, without seeing each other’s prices.',
  },
  {
    title: 'Best bid wins, you save',
    body: 'At 17:00 the best bid wins. You pay and keep 50% of the verified saving. No winner, no charge.',
  },
];

export function PoolSaveSteps() {
  return (
    <div className="rounded-md bg-pale-blue p-4 sm:p-6">
      <h2 className="mb-4 text-lg text-ink sm:text-xl">How Pool &amp; Save works</h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-2 rounded-md bg-surface p-4">
            <span className="flex size-8 items-center justify-center rounded-full bg-cyan-text font-mono text-sm font-medium text-white">
              {i + 1}
            </span>
            <span className="text-[15px] font-bold text-ink">{step.title}</span>
            <span className="text-[13px] leading-relaxed text-slate">{step.body}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
