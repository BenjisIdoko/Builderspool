'use client';

import { useState } from 'react';
import { CheckIcon, ShoppingCartIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { Button } from '@/components/ui/button';

// Card-level add: one tap adds a single unit (quantity is changed in the cart
// or on the product page). Outline until hovered, so a rail of cards doesn't
// shout twelve identical orange buttons.
export function AddToCartButton({ material }: { material: BuyerMaterial }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-1.5 border-cta text-cta hover:bg-cta hover:text-white"
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
          1
        );
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? (
        <>
          <CheckIcon className="size-4" />
          Added
        </>
      ) : (
        <>
          <ShoppingCartIcon className="size-4" />
          Add to cart
        </>
      )}
    </Button>
  );
}
