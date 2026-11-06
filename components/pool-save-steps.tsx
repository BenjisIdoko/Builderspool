// "How Pool & Save works" — four numbered steps in one row on a pale-blue
// band, copy as on the Floot site. Typographic on purpose: the numerals carry
// the rhythm until there is photography for each step.
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
    <div className="mx-auto w-full max-w-section py-section">
      <h2 className="text-heading-lg text-ink">How Pool &amp; Save works</h2>
      <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="border-t-2 border-cyan-text pt-4">
            <span className="font-mono text-figure-lg text-cyan-text">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-3 text-heading-sm text-ink">{step.title}</h3>
            <p className="mt-2 max-w-[34ch] text-body-sm text-slate">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
