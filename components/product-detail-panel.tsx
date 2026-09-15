'use client';

import { useState } from 'react';
import { BellIcon, FileTextIcon, MinusIcon, PackageIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { createPriceAlert } from '@/app/(shop)/catalog/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PriceHistoryChart } from '@/components/price-history-chart';
import { QuantityInput } from '@/components/quantity-input';

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
  const [specsOpen, setSpecsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertState, setAlertState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const regionLabel = material.sourcingScope === 'NATIONAL' ? 'National' : 'Regional';

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

  const stepper = (
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
  );

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">
        {material.category} · {regionLabel}
      </div>
      <h1 className="mb-5 text-[28px] font-bold tracking-tight text-ink">{material.name}</h1>
      <div className="mb-7 text-3xl font-semibold text-ink">
        {formatNaira(material.catalogPrice)}{' '}
        <span className="font-sans text-sm font-medium text-muted-foreground">/ {material.unit}</span>
      </div>

      <div className="mb-5 flex items-center gap-3">
        {stepper}
        <span className="text-sm text-muted-foreground">{material.unit}</span>
      </div>

      <div className="flex gap-2.5">
        <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => setSpecsOpen(true)}>
          <FileTextIcon className="size-4" />
          Technical specs
        </Button>
        <Button type="button" className="flex-[1.4] gap-2" onClick={handleAdd}>
          <PlusIcon className="size-4" />
          {added ? 'Added' : 'Place order'}
        </Button>
      </div>

      <Dialog open={specsOpen} onOpenChange={setSpecsOpen}>
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-border text-slate">
                {material.category}
              </Badge>
              <Badge variant="outline" className="bg-success-soft text-success border-transparent">
                {regionLabel === 'National' ? 'Available nationally' : 'Available in your region'}
              </Badge>
            </div>
            <DialogTitle className="text-xl">{material.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
            <div className="bg-surface p-4">
              <div className="mb-1.5 text-[11px] text-muted-foreground">Fixed catalogue price</div>
              <div className="text-xl font-semibold text-ink">
                {formatNaira(material.catalogPrice)}{' '}
                <span className="font-sans text-xs font-medium text-muted-foreground">/ {material.unit}</span>
              </div>
            </div>
            <div className="bg-surface p-4">
              <div className="mb-1.5 text-[11px] text-muted-foreground">Sourcing</div>
              <div className="text-sm font-semibold text-ink">
                {material.sourcingScope === 'NATIONAL' ? 'Sourced nationally' : 'Sourced regionally'}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 text-xs font-bold text-slate">Price history</div>
            <PriceHistoryChart points={priceHistory} />
          </div>

          <div>
            <div className="mb-3 text-xs font-bold text-slate">Standard specifications</div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
              {SPEC_FIELDS.map(({ key, label }) => (
                <div key={key} className="bg-surface p-4">
                  <div className="mb-1.5 text-[11px] text-muted-foreground">{label}</div>
                  <div className="text-sm font-semibold text-ink">{material[key] ?? '—'}</div>
                </div>
              ))}
            </div>
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

          <div className="flex items-center gap-3 border-t border-border pt-5">
            {stepper}
            <Button type="button" className="flex-1 gap-2" onClick={handleAdd}>
              <PackageIcon className="size-4" />
              {added ? 'Added' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
