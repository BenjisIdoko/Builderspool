'use client';

import Link from 'next/link';
import { LockKeyIcon, MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { MaterialImage } from '@/components/material-image';
import { QuantityInput } from '@/components/quantity-input';
import { CheckoutSteps } from '@/components/checkout-steps';
import { SwipeToDelete } from '@/components/swipe-to-delete';

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 pt-28 pb-24 text-center">
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
    <div className="mx-auto w-full max-w-section px-6 pt-28 pb-24 lg:pb-10">
      <CheckoutSteps current={0} />
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink">
        Cart <span className="font-normal text-muted-foreground">({itemCount} items)</span>
      </h1>

      <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-success-soft px-4 py-3.5 text-sm text-success">
        <LockKeyIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong>Escrow protected.</strong> Funds stay held by Builders Pool and release to the fulfilling
          supplier only after your fulfillment center confirms receipt.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">
            Materials · {lines.length} line {lines.length === 1 ? 'item' : 'items'}
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {lines.map((line) => (
            <SwipeToDelete key={line.materialId} onDelete={() => removeItem(line.materialId)} label={`Remove ${line.name}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:flex-nowrap">
              <MaterialImage
                imageUrl={line.imageUrl}
                category={line.category}
                alt={line.name}
                className="size-16 shrink-0 rounded-md border border-border"
                sizes="64px"
              />

              <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-9rem)]">
                <Link href={`/catalog/${line.materialId}`} className="font-semibold text-ink hover:underline">
                  {line.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  <span>{formatNaira(line.catalogPrice)}</span> / {line.unit}
                </div>
              </div>

              <div className="flex items-center overflow-hidden rounded-lg border border-border-strong max-sm:order-2 max-sm:ml-20">
                <button
                  type="button"
                  className="flex size-[26px] items-center justify-center max-sm:size-9 bg-well text-ink transition-colors hover:bg-border-strong/40"
                  onClick={() => updateQuantity(line.materialId, line.quantity - 1)}
                  aria-label={`Decrease quantity of ${line.name}`}
                >
                  <MinusIcon className="size-3" />
                </button>
                <QuantityInput
                  value={line.quantity}
                  onChange={(next) => updateQuantity(line.materialId, next)}
                  label={line.name}
                  className="w-9 text-sm font-bold text-ink"
                />
                <button
                  type="button"
                  className="flex size-[26px] items-center justify-center max-sm:size-9 bg-well text-ink transition-colors hover:bg-border-strong/40"
                  onClick={() => updateQuantity(line.materialId, line.quantity + 1)}
                  aria-label={`Increase quantity of ${line.name}`}
                >
                  <PlusIcon className="size-3" />
                </button>
              </div>

              <div className="w-24 text-right font-bold tabular-nums text-ink max-sm:order-2 max-sm:ml-auto max-sm:w-auto">
                {formatNaira(line.catalogPrice * line.quantity)}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(line.materialId)}
                aria-label={`Remove ${line.name}`}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
            </SwipeToDelete>
          ))}
          </div>
        </div>

        <div className="h-fit">
          <h2 className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">Order summary</h2>
          <div className="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Subtotal</span>
            <span className="font-bold tabular-nums text-ink">{formatNaira(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Delivery calculated at checkout.</p>

          <Button asChild size="lg" className="mt-5 w-full max-lg:hidden">
            <Link href="/checkout">Continue to checkout</Link>
          </Button>
          </div>
        </div>
      </div>

      {/* Phones: sticky checkout bar, sitting above the bottom tab bar
          (BuyerMobileApp handoff). */}
      <div className="fixed inset-x-0 bottom-[calc(61px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-[10px] lg:hidden">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Subtotal</div>
          <div className="text-base font-extrabold tabular-nums text-ink">{formatNaira(subtotal)}</div>
        </div>
        <Button asChild className="h-12 flex-1 rounded-full text-[14.5px] font-bold">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
