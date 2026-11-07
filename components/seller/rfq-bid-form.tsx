'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitSheetBidAction } from '@/app/seller/(dashboard)/rfqs/actions';
import { MaterialImage } from '@/components/material-image';
import { Money } from '@/components/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type RfqLine = {
  id: string;
  name: string;
  unit: string;
  imageUrl: string | null;
  category: string;
  quantity: number;
  ceiling: { price: number; basis: 'REFERENCE' | 'BUYER_PRICE' } | null;
};

const toPrice = (raw: string) => Number(raw.replace(/,/g, ''));

// One bid per sheet, priced line by line. The review step is deliberate: the bid
// cannot be changed once sent, and a price above any reference rules out the whole bid.
export function RfqBidForm({ sheetId, lines }: { sheetId: string; lines: RfqLine[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entered = (l: RfqLine) => toPrice(prices[l.id] ?? '');
  const allFilled = lines.every((l) => Number.isFinite(entered(l)) && entered(l) > 0);
  const above = lines.filter((l) => l.ceiling !== null && entered(l) > l.ceiling.price);
  const total = lines.reduce((sum, l) => sum + (Number.isFinite(entered(l)) ? entered(l) : 0) * l.quantity, 0);

  function submit() {
    setError(null);
    const body = Object.fromEntries(lines.map((l) => [l.id, entered(l)]));
    startTransition(async () => {
      const r = await submitSheetBidAction(sheetId, body);
      if ('error' in r) {
        setError(r.error);
        setReviewing(false);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-hairline overflow-hidden rounded-lg bg-card-alt">
        {lines.map((l) => {
          const isAbove = l.ceiling !== null && entered(l) > l.ceiling.price;
          return (
            <li key={l.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
              <MaterialImage imageUrl={l.imageUrl} category={l.category} alt={l.name} className="size-16 shrink-0 rounded-md border border-border" sizes="64px" />
              <div className="min-w-0 flex-1 basis-48">
                <div className="font-bold text-ink">{l.name}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {l.quantity.toLocaleString('en-NG')} × {l.unit}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {l.ceiling === null ? (
                    'No limit for this item'
                  ) : (
                    <>
                      Must not be above <span className="font-mono tabular-nums text-ink"><Money amount={l.ceiling.price} /></span> each
                      {l.ceiling.basis === 'BUYER_PRICE' && ' (no reference price, so the lowest price a buyer paid)'}
                    </>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-40">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor={`price-${l.id}`}>
                  Your price each (₦)
                </label>
                <Input
                  id={`price-${l.id}`}
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={reviewing || isPending}
                  value={prices[l.id] ?? ''}
                  onChange={(e) => setPrices((p) => ({ ...p, [l.id]: e.target.value }))}
                  aria-invalid={isAbove}
                  className="font-mono tabular-nums"
                />
                {isAbove && <p className="mt-1 text-caption text-danger">Above the limit.</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card-alt px-5 py-4">
        <span className="text-sm text-muted-foreground">Your bid in total</span>
        <span className="font-mono text-figure-lg tabular-nums text-ink">
          <Money amount={total} />
        </span>
      </div>

      {above.length > 0 && (
        <p className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {above.length === 1 ? 'One price is' : `${above.length} prices are`} above the limit ({above.map((l) => l.name).join(', ')}). A bid with any price above its
          limit is ruled out as a whole when bids close.
        </p>
      )}

      {reviewing && (
        <p className="rounded-md bg-surface px-4 py-3 text-sm text-ink">
          You can send <strong>one</strong> bid on this sheet and cannot change it afterwards. Check your prices, then confirm.
        </p>
      )}

      {error && (
        <p className="text-caption text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {!reviewing ? (
          <Button type="button" disabled={!allFilled || isPending} onClick={() => setReviewing(true)}>
            Review bid
          </Button>
        ) : (
          <>
            <Button type="button" disabled={isPending} onClick={submit}>
              {isPending ? 'Sending…' : 'Confirm and send bid'}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setReviewing(false)}>
              Back to prices
            </Button>
          </>
        )}
        {!allFilled && !reviewing && <span className="self-center text-caption text-muted-foreground">Price every item to continue.</span>}
      </div>
    </div>
  );
}
