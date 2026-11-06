'use client';

import { MinusIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { QuantityInput } from '@/components/quantity-input';

// One quantity control for every buyer surface (buy box, bottom sheet, cart):
// 44px touch targets, a 3:1 control boundary, and the shared QuantityInput so
// typing a number works the same everywhere.
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  className = '',
}: {
  value: number;
  onChange: (next: number) => void;
  /** Material name, used in the accessible labels. */
  label: string;
  min?: number;
  className?: string;
}) {
  const stepClass =
    'flex size-11 shrink-0 items-center justify-center bg-well text-ink transition-colors hover:bg-border-strong/40';

  return (
    <div className={`flex items-center overflow-hidden rounded-md border border-input ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Decrease quantity of ${label}`}
        className={stepClass}
      >
        <MinusIcon className="size-4" />
      </button>
      <QuantityInput value={value} onChange={onChange} label={label} className="w-12 text-body font-bold text-ink" />
      <button type="button" onClick={() => onChange(value + 1)} aria-label={`Increase quantity of ${label}`} className={stepClass}>
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
