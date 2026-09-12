'use client';

import { useState } from 'react';
import { MinusIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { Button } from '@/components/ui/button';

export function AddToCartButton({ material }: { material: BuyerMaterial }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border border-border-strong">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-r-none"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label={`Decrease quantity of ${material.name}`}
        >
          <MinusIcon className="size-3" />
        </Button>
        <span className="w-7 text-center text-sm tabular-nums text-ink">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-l-none"
          onClick={() => setQuantity((q) => q + 1)}
          aria-label={`Increase quantity of ${material.name}`}
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>

      <Button
        type="button"
        className="flex-1"
        onClick={() => {
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
        }}
      >
        {added ? 'Added' : 'Add to cart'}
      </Button>
    </div>
  );
}
