'use client';

import { MapPinIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';
import { viewOnMapUrl } from '@/lib/maps';
import type { PickupCenter } from '@/lib/queries/pickupCenters';

// A pick-one list of pickup stations: name and address on a card, a real radio
// input for the choice, and a map link that stays outside the label so it can
// be used without changing the choice.
export function PickupStationList({
  centers,
  value,
  onChange,
  name,
  label,
}: {
  centers: PickupCenter[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2.5">
      {centers.map((c) => {
        const selected = c.id === value;
        return (
          <div
            key={c.id}
            className={`rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--color-hairline)] transition-[box-shadow,background-color] duration-150 has-focus-visible:ring-2 has-focus-visible:ring-ring ${
              selected ? 'bg-info-soft shadow-[0_0_0_2px_var(--color-brand)]' : 'hover:bg-well/60'
            }`}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name={name}
                value={c.id}
                checked={selected}
                onChange={() => onChange(c.id)}
                className="mt-1 size-4 shrink-0 accent-brand outline-none"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-pretty text-sm font-semibold text-ink">{c.name}</span>
                <span className="mt-0.5 flex items-start gap-1.5 text-pretty text-sm text-muted-foreground">
                  <MapPinIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {c.address}
                </span>
              </span>
            </label>
            <div className="mt-2 pl-7">
              <Button asChild variant="ghost" size="sm" className="-ml-2 max-sm:h-11">
                <a href={viewOnMapUrl(c.address)} target="_blank" rel="noopener noreferrer">
                  View on map
                </a>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
