'use client';

import Link from 'next/link';
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from 'motion/react';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { useCart } from '@/lib/cart/CartContext';
import { formatNaira } from '@/lib/format';
import { linePrice } from '@/lib/cart/types';
import { AnimatedNaira } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { MaterialImage } from '@/components/material-image';
import { QuantityStepper } from '@/components/quantity-stepper';

// The items on the checkout screen: change a quantity or remove a line without leaving the page.
// Lines fade and settle in and out, the rest close up around them, and each line total rolls to its
// new figure. Under prefers-reduced-motion everything simply updates.
export function CheckoutLineItems() {
  const { lines, updateQuantity, removeItem } = useCart();

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <ul className="divide-y divide-border rounded-lg bg-surface">
          <AnimatePresence initial={false} mode="popLayout">
            {lines.map((line) => (
              <m.li
                key={line.materialId}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3 bg-surface p-4 sm:grid-cols-[auto_1fr_auto_7rem_auto]"
              >
                <MaterialImage
                  imageUrl={line.imageUrl}
                  category={line.category}
                  alt={line.name}
                  className="size-12 shrink-0 rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  sizes="48px"
                />

                <div className="min-w-0">
                  <div className="text-pretty text-sm font-semibold text-ink">{line.name}</div>
                  <div className="text-caption tabular-nums text-muted-foreground">
                    {formatNaira(linePrice(line))} / {line.unit}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(line.materialId)}
                  aria-label={`Remove ${line.name}`}
                  className="col-start-3 row-start-1 sm:col-start-5"
                >
                  <TrashIcon className="size-4" />
                </Button>

                <QuantityStepper
                  value={line.quantity}
                  onChange={(next) => updateQuantity(line.materialId, next)}
                  label={line.name}
                  className="col-span-2 col-start-1 row-start-2 justify-self-start sm:col-span-1 sm:col-start-3 sm:row-start-1"
                />

                <div className="col-start-3 row-start-2 text-right font-bold text-ink sm:col-start-4 sm:row-start-1">
                  <AnimatedNaira value={linePrice(line) * line.quantity} />
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      </MotionConfig>
    </LazyMotion>
  );
}

export function AddMoreMaterials() {
  return (
    <Link
      href="/catalog"
      className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      <PlusIcon className="size-4" />
      Add more materials
    </Link>
  );
}
