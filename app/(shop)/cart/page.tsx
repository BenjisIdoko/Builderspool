'use client';

import Link from 'next/link';
import { LockKeyIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyCartIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';
import { MaterialImage } from '@/components/material-image';
import { QuantityStepper } from '@/components/quantity-stepper';
import { CheckoutSteps } from '@/components/checkout-steps';
import { SwipeToDelete } from '@/components/swipe-to-delete';

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pt-12 pb-24">
        <EmptyState
          illustration={EmptyCartIllustration}
          as="h1"
          title="Your cart is empty"
          description="Add materials from the catalog to get started."
        >
          <Button asChild size="lg">
            <Link href="/catalog">Browse the catalog</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-24 lg:pb-10">
      <CheckoutSteps current={0} />
      <h1 className="mb-6 text-ink">
        Cart <span className="font-normal text-muted-foreground">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
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
          <h2 className="mb-3 text-label text-slate uppercase">
            Materials · {lines.length} line {lines.length === 1 ? 'item' : 'items'}
          </h2>
          <div className="divide-y divide-border rounded-lg bg-surface">
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

              <QuantityStepper
                value={line.quantity}
                onChange={(next) => updateQuantity(line.materialId, next)}
                label={line.name}
                className="max-sm:order-2 max-sm:ml-20"
              />

              <div className="w-28 text-right text-price-sm tabular-nums text-ink max-sm:order-2 max-sm:ml-auto max-sm:w-auto">
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
          <h2 className="mb-3 text-label text-slate uppercase">Order summary</h2>
          <div className="rounded-lg bg-surface p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Subtotal</span>
            <span className="text-price-sm tabular-nums text-ink">{formatNaira(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Delivery calculated at checkout.</p>

          <Button asChild variant="cta" size="lg" className="mt-5 w-full max-lg:hidden">
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
          <div className="text-price-sm tabular-nums text-ink">{formatNaira(subtotal)}</div>
        </div>
        <Button asChild variant="cta" size="lg" className="flex-1">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
