'use client';

import { useState } from 'react';
import { FileTextIcon, MinusIcon, PackageIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PriceHistoryChart } from '@/components/price-history-chart';

export function ProductDetailPanel({
  material,
  priceHistory,
}: {
  material: BuyerMaterial;
  priceHistory: { date: Date; price: number }[];
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const total = material.catalogPrice * quantity;
  const regionLabel = material.sourcingScope === 'NATIONAL' ? 'National' : 'Regional';

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
      <span className="min-w-[2.5ch] border-x border-border px-2 text-center font-mono text-sm font-semibold text-ink">
        {quantity}
      </span>
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
      <div className="mb-7 font-mono text-3xl font-semibold text-ink">
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
          {added ? 'Added' : <>Add to order — <span className="font-mono">{formatNaira(total)}</span></>}
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
              <div className="font-mono text-xl font-semibold text-ink">
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

          {material.spec && (
            <div>
              <div className="mb-3 text-xs font-bold text-slate">Specification</div>
              <div className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">{material.spec}</div>
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-border pt-5">
            {stepper}
            <Button type="button" className="flex-1 gap-2" onClick={handleAdd}>
              <PackageIcon className="size-4" />
              {added ? 'Added' : <>Confirm &amp; add to order — <span className="font-mono">{formatNaira(total)}</span></>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
