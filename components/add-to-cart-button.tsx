'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart/CartContext';
import type { BuyerMaterial } from '@/lib/queries/materials';

export function AddToCartButton({ material }: { material: BuyerMaterial }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
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
      className="shrink-0 rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      {added ? 'Added' : 'Add to cart'}
    </button>
  );
}
