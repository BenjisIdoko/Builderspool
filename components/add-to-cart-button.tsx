'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart/CartContext';
import type { BuyerMaterial } from '@/lib/queries/materials';
import { Button } from '@/components/ui/button';

export function AddToCartButton({ material }: { material: BuyerMaterial }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      size="lg"
      className="shrink-0"
      onClick={() => {
        addItem({
          materialId: material.id,
          name: material.name,
          unit: material.unit,
          category: material.category,
          catalogPrice: material.catalogPrice,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? 'Added' : 'Add to cart'}
    </Button>
  );
}
