'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MinusIcon, PlusIcon, ShoppingCartIcon, XIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaterialImage } from '@/components/material-image';
import { QuantityInput } from '@/components/quantity-input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';

export function CartSheet() {
  const { lines, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative size-[34px] rounded-full text-slate"
          aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        >
          <ShoppingCartIcon className="size-4.5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 min-w-[1rem] justify-center rounded-full px-1 text-[10px]">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>
            Cart (<span>{itemCount}</span> {itemCount === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-slate">Your cart is empty.</p>
            <SheetClose asChild>
              <Button asChild size="lg">
                <Link href="/catalog">Browse the catalog</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-border overflow-y-auto">
              {lines.map((line) => (
                <div key={line.materialId} className="flex items-center gap-3 px-4 py-4">
                  <MaterialImage
                    imageUrl={line.imageUrl}
                    category={line.category}
                    alt={line.name}
                    className="size-14 shrink-0 rounded-md border border-border"
                    sizes="56px"
                  />

                  <div className="min-w-0 flex-1">
                    <SheetClose asChild>
                      <Link
                        href={`/catalog/${line.materialId}`}
                        className="line-clamp-1 text-sm font-semibold text-ink hover:underline"
                      >
                        {line.name}
                      </Link>
                    </SheetClose>
                    <div className="text-xs text-muted-foreground">
                      <span>{formatNaira(line.catalogPrice)}</span> / {line.unit}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
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
                        <QuantityInput
                          value={line.quantity}
                          onChange={(next) => updateQuantity(line.materialId, next)}
                          label={line.name}
                          className="w-7 text-sm tabular-nums text-ink"
                        />
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

                      <span className="text-sm font-bold tabular-nums text-ink">
                        {formatNaira(line.catalogPrice * line.quantity)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="self-start"
                    onClick={() => removeItem(line.materialId)}
                    aria-label={`Remove ${line.name}`}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate">Subtotal</span>
                <span className="font-bold tabular-nums text-ink">{formatNaira(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Delivery calculated at checkout.</p>
              <SheetClose asChild>
                <Button asChild size="lg" className="w-full">
                  <Link href="/checkout">Continue to checkout</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/cart" className="text-center text-sm text-brand hover:underline">
                  View full cart
                </Link>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
