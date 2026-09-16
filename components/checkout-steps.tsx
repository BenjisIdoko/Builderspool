import { CheckIcon } from '@phosphor-icons/react/ssr';

const STEPS = ['Cart', 'Checkout', 'Confirmed'] as const;

// Real 3-step flow — matches the actual pages a buyer moves through, not
// a fabricated procurement-workflow narrative.
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="mb-8 flex items-center gap-2 text-xs font-medium">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 ${
              i < current ? 'text-ink' : i === current ? 'text-brand' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex size-4.5 items-center justify-center rounded-full text-[10px] ${
                i < current
                  ? 'bg-ink text-canvas'
                  : i === current
                    ? 'border-2 border-brand text-brand'
                    : 'border border-border-strong'
              }`}
            >
              {i < current ? <CheckIcon className="size-2.5" weight="bold" /> : i + 1}
            </span>
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}
