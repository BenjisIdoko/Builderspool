'use client';

import { useState } from 'react';
import { LockKeyIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { Button } from '@/components/ui/button';
import { QuantityInput } from '@/components/quantity-input';

// The compact purchase card — split out from ProductDetailPanel (which now
// only carries the title/tabs for the left column) to match the Fable
// handoff's real structure: a focused, bordered "buy box" in the right
// rail, not everything crammed into one column.
export function ProductBuyBox({ material }: { material: BuyerMaterial }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_rgba(16,24,40,0.08)] lg:sticky lg:top-24">
      <div className="mb-5 text-2xl font-bold text-ink">
        {formatNaira(material.catalogPrice)}{' '}
        <span className="font-sans text-sm font-medium text-muted-foreground">/ {material.unit}</span>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-slate">Quantity ({material.unit})</span>
        <div className="flex items-center overflow-hidden rounded-lg border border-border-strong">
          <button
            type="button"
            onClick={decrement}
            aria-label={`Decrease quantity of ${material.name}`}
            className="flex size-[30px] items-center justify-center bg-well text-ink transition-colors hover:bg-border-strong/40"
          >
            <MinusIcon className="size-3.5" />
          </button>
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            label={material.name}
            className="w-11 text-sm font-bold text-ink"
          />
          <button
            type="button"
            onClick={increment}
            aria-label={`Increase quantity of ${material.name}`}
            className="flex size-[30px] items-center justify-center bg-well text-ink transition-colors hover:bg-border-strong/40"
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-slate">
          <span>Subtotal</span>
          <span className="font-bold tabular-nums text-ink">{formatNaira(material.catalogPrice * quantity)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Delivery calculated at checkout.</p>
      </div>

      <Button type="button" className="mb-3 w-full gap-2" size="lg" onClick={handleAdd}>
        <PlusIcon className="size-4" />
        {added ? 'Added' : 'Place order'}
      </Button>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <LockKeyIcon className="mt-0.5 size-3.5 shrink-0" />
        Held in escrow once paid — released only after the fulfillment center confirms receipt.
      </p>
    </div>
  );
}
