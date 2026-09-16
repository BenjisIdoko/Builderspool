'use client';

import { useRouter } from 'next/navigation';
import { PrinterIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { Button } from '@/components/ui/button';
import type { BuyerOrder } from '@/lib/queries/orders';

// "Reorder" re-adds each line at today's real catalogPrice, not the
// historical priceLocked shown elsewhere on this page — a reorder is a new
// order, and prices may have moved since the original one.
export function OrderActions({ items }: { items: BuyerOrder['items'] }) {
  const router = useRouter();
  const { addItem } = useCart();

  function handleReorder() {
    for (const item of items) {
      addItem(
        {
          materialId: item.material.id,
          name: item.material.name,
          unit: item.material.unit,
          category: item.material.category,
          catalogPrice: item.material.catalogPrice,
          imageUrl: item.material.imageUrl,
        },
        item.quantity
      );
    }
    router.push('/cart');
  }

  return (
    <div className="flex gap-2">
      <Button type="button" onClick={handleReorder} className="gap-2">
        <ArrowsClockwiseIcon className="size-4" />
        Reorder
      </Button>
      <Button type="button" variant="outline" onClick={() => window.print()} className="gap-2">
        <PrinterIcon className="size-4" />
        Print
      </Button>
    </div>
  );
}
