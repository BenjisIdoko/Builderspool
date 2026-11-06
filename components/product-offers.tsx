'use client';

import { SealCheckIcon } from '@phosphor-icons/react/ssr';
import { Money } from '@/components/money';
import { useOfferSelection } from '@/components/offer-selection';

function leadTime(days: number) {
  if (days <= 0) return 'Same day';
  return days === 1 ? '1 day' : `${days} days`;
}

// Seller offers for one product, cheapest first. Renders nothing until at
// least one verified seller has a live listing, so the page never shows an
// empty "offers" box.
export function ProductOffers({ unit }: { unit: string }) {
  const { offers, selected, select } = useOfferSelection();
  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="offers-heading" className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-hairline)]">
      <h2 id="offers-heading" className="text-heading-sm text-ink">
        Offers from sellers ({offers.length})
      </h2>
      <p className="mt-1 text-body-sm text-slate">Each seller sets their own price per {unit}. Pick the seller you want; your price follows your choice.</p>

      <ul role="radiogroup" aria-labelledby="offers-heading" className="mt-4 divide-y divide-hairline">
        {offers.map((o, i) => (
          <li key={o.id}>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 py-3">
              <input
                type="radio"
                name="offer"
                value={o.id}
                checked={selected?.id === o.id}
                onChange={() => select(o.id)}
                className="size-5 shrink-0 accent-[var(--color-ink)]"
              />
            {o.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.photoUrl} alt="" className="size-12 shrink-0 rounded-md bg-well object-cover" />
            ) : (
              <div aria-hidden className="size-12 shrink-0 rounded-md bg-well" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="truncate text-body-sm font-medium text-ink">{o.seller}</span>
                <span className="inline-flex items-center gap-1 text-caption text-success">
                  <SealCheckIcon weight="fill" className="size-3.5" />
                  Verified
                </span>
                {i === 0 && offers.length > 1 && (
                  <span className="rounded-full bg-cyan px-2 py-0.5 text-caption font-bold text-ink">Lowest price</span>
                )}
              </div>
              <div className="text-caption text-slate">
                Delivery lead time {leadTime(o.leadTimeDays)}
                {o.shelfLifeDays != null && ` · ${o.shelfLifeDays} days shelf life`}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-figure tabular-nums text-ink">
                <Money amount={o.price} />
              </div>
              <div className="text-caption text-slate">per {unit}</div>
            </div>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
