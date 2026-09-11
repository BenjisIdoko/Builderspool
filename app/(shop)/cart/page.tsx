'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-medium text-ink">Your cart is empty</h1>
        <p className="text-slate">Add materials from the catalog to get started.</p>
        <Button asChild size="lg">
          <Link href="/catalog">Browse the catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-medium tracking-tight text-ink">Cart</h1>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {lines.map((line) => (
          <div key={line.materialId} className="flex items-center gap-4 p-5">
            <div className="flex-1">
              <Link href={`/catalog/${line.materialId}`} className="font-medium text-ink hover:underline">
                {line.name}
              </Link>
              <div className="text-sm text-muted-foreground">
                {formatNaira(line.catalogPrice)} / {line.unit}
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-md border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => updateQuantity(line.materialId, line.quantity - 1)}
                aria-label={`Decrease quantity of ${line.name}`}
              >
                −
              </Button>
              <span className="w-6 text-center text-sm text-ink">{line.quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => updateQuantity(line.materialId, line.quantity + 1)}
                aria-label={`Increase quantity of ${line.name}`}
              >
                +
              </Button>
            </div>

            <div className="w-24 text-right text-sm font-medium text-ink">
              {formatNaira(line.catalogPrice * line.quantity)}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => removeItem(line.materialId)}
              aria-label={`Remove ${line.name}`}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-surface p-5">
        <span className="text-sm text-slate">Subtotal</span>
        <span className="text-lg font-medium text-ink">{formatNaira(subtotal)}</span>
      </div>

      <div className="mt-6 flex justify-end">
        <Button asChild size="lg">
          <Link href="/checkout">Continue to checkout</Link>
        </Button>
      </div>
    </div>
  );
}
