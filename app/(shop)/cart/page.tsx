'use client';

import Link from 'next/link';
import { MinusIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { MaterialImage } from '@/components/material-image';

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-xl font-bold text-ink">Your cart is empty</h1>
        <p className="text-slate">Add materials from the catalog to get started.</p>
        <Button asChild size="lg">
          <Link href="/catalog">Browse the catalog</Link>
        </Button>
      </div>
    );
  }

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">
        Cart <span className="font-normal text-muted-foreground">({itemCount} items)</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {lines.map((line) => (
            <div key={line.materialId} className="flex items-center gap-4 p-4">
              <MaterialImage
                imageUrl={line.imageUrl}
                category={line.category}
                alt={line.name}
                className="size-16 shrink-0 rounded-md border border-border"
                sizes="64px"
              />

              <div className="min-w-0 flex-1">
                <Link href={`/catalog/${line.materialId}`} className="font-semibold text-ink hover:underline">
                  {line.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  <span>{formatNaira(line.catalogPrice)}</span> / {line.unit}
                </div>
              </div>

              <div className="flex items-center rounded-md border border-border-strong">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-r-none"
                  onClick={() => updateQuantity(line.materialId, line.quantity - 1)}
                  aria-label={`Decrease quantity of ${line.name}`}
                >
                  <MinusIcon className="size-3" />
                </Button>
                <span className="w-8 text-center text-sm tabular-nums text-ink">{line.quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-l-none"
                  onClick={() => updateQuantity(line.materialId, line.quantity + 1)}
                  aria-label={`Increase quantity of ${line.name}`}
                >
                  <PlusIcon className="size-3" />
                </Button>
              </div>

              <div className="w-24 text-right font-bold tabular-nums text-ink">
                {formatNaira(line.catalogPrice * line.quantity)}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(line.materialId)}
                aria-label={`Remove ${line.name}`}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-sm font-bold text-slate">Order summary</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Subtotal</span>
            <span className="font-bold tabular-nums text-ink">{formatNaira(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Delivery calculated at checkout.</p>

          <Button asChild size="lg" className="mt-5 w-full">
            <Link href="/checkout">Continue to checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
