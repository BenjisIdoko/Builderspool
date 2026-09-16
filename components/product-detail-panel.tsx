'use client';

import { useState } from 'react';
import { BellIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { createPriceAlert } from '@/app/(shop)/catalog/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PriceHistoryChart } from '@/components/price-history-chart';
import { QuantityInput } from '@/components/quantity-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SPEC_FIELDS = [
  { key: 'grade', label: 'Grade' },
  { key: 'standard', label: 'Standard' },
  { key: 'dimensions', label: 'Dimensions' },
  { key: 'weight', label: 'Weight' },
] as const;

export function ProductDetailPanel({
  material,
  priceHistory,
  fulfillmentCenters,
}: {
  material: BuyerMaterial;
  priceHistory: { date: Date; price: number }[];
  fulfillmentCenters: { name: string; region: string }[];
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertState, setAlertState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const regionLabel = material.sourcingScope === 'NATIONAL' ? 'National' : 'Regional';
  const hasDetails = SPEC_FIELDS.some(({ key }) => material[key]);
  // Only real, content-backed tabs — no "Reviews"/"Company"/"Usage guide"
  // equivalents exist (no review system, and a seller identity can never
  // appear here — blind bidding), so this list is exactly what's real.
  const defaultTab = material.spec ? 'description' : hasDetails ? 'details' : 'pricing';

  async function handleSetAlert() {
    const target = Number(alertPrice);
    if (!Number.isFinite(target) || target <= 0) return;
    setAlertState('saving');
    await createPriceAlert(material.id, target);
    setAlertState('saved');
    setAlertPrice('');
    setTimeout(() => setAlertState('idle'), 2000);
  }

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }
  function increment() {
    setQuantity((q) => q + 1);
  }
  function handleAdd() {
    addItem(
      {
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        category: material.category,
        catalogPrice: material.catalogPrice,
        imageUrl: material.imageUrl,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {material.category} · {regionLabel}
      </div>
      <h1 className="mb-5 text-[28px] font-bold tracking-tight text-ink">{material.name}</h1>
      <div className="mb-7 text-3xl font-semibold text-ink">
        {formatNaira(material.catalogPrice)}{' '}
        <span className="font-sans text-sm font-medium text-muted-foreground">/ {material.unit}</span>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex items-center rounded-md border border-border">
          <button
            type="button"
            onClick={decrement}
            aria-label={`Decrease quantity of ${material.name}`}
            className="px-4 py-2.5 text-slate transition-colors hover:text-ink"
          >
            <MinusIcon className="size-3.5" />
          </button>
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            label={material.name}
            className="min-w-[2.5ch] border-x border-border px-2 text-sm font-semibold text-ink"
          />
          <button
            type="button"
            onClick={increment}
            aria-label={`Increase quantity of ${material.name}`}
            className="px-4 py-2.5 text-slate transition-colors hover:text-ink"
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">{material.unit}</span>
      </div>

      <Button type="button" className="mb-10 w-full gap-2" size="lg" onClick={handleAdd}>
        <PlusIcon className="size-4" />
        {added ? 'Added' : 'Place order'}
      </Button>

      <Tabs defaultValue={defaultTab}>
        <TabsList variant="line" className="mb-6 h-auto w-full justify-start gap-6 border-b border-border pb-0">
          {material.spec && (
            <TabsTrigger value="description" className="flex-none text-sm">
              Description
            </TabsTrigger>
          )}
          {hasDetails && (
            <TabsTrigger value="details" className="flex-none text-sm">
              Details
            </TabsTrigger>
          )}
          <TabsTrigger value="pricing" className="flex-none text-sm">
            Pricing &amp; delivery
          </TabsTrigger>
        </TabsList>

        {material.spec && (
          <TabsContent value="description">
            <p className="text-sm leading-relaxed text-ink">{material.spec}</p>
          </TabsContent>
        )}

        {hasDetails && (
          <TabsContent value="details">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {SPEC_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-surface p-4">
                  <div className="mb-1.5 text-[11px] text-muted-foreground">{label}</div>
                  <div className="text-sm font-semibold text-ink">{material[key] ?? '—'}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="pricing" className="flex flex-col gap-6">
          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 text-xs font-bold text-slate">Price history</div>
            <PriceHistoryChart points={priceHistory} />
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-1 text-xs font-bold text-slate">Serving hubs</div>
            <p className="mb-3 text-xs text-muted-foreground">
              {regionLabel === 'National'
                ? 'Sourced nationally — fulfilled from whichever hub is closest to your delivery region.'
                : 'Regionally sourced — fulfilled from whichever hub covers the region you choose at checkout.'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fulfillmentCenters.map((center) => (
                <Badge key={center.name} variant="outline" className="border-border text-slate">
                  {center.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate">
              <BellIcon className="size-3.5" />
              Notify me at a target price
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              We&apos;ll save this — there&apos;s no email/SMS alerting yet, so check back here to see if it&apos;s
              been reached.
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder={`e.g. ${Math.round(material.catalogPrice * 0.9)}`}
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!alertPrice || alertState === 'saving'}
                onClick={handleSetAlert}
              >
                {alertState === 'saved' ? 'Saved' : 'Set alert'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
