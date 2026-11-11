"use client";

import { useState } from "react";
import {
  CaretDownIcon,
  CheckIcon,
  LockKeyIcon,
  PlusIcon,
} from "@phosphor-icons/react/ssr";
import { useCart } from "@/lib/cart/CartContext";
import { useOfferSelection } from "@/components/offer-selection";
import { formatNaira } from "@/lib/format";
import type { BuyerMaterial } from "@/lib/queries/materials";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/quantity-stepper";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

// Plus turns into a check once the item is added. Both icons stay mounted and cross-fade (scale
// 0.25 to 1, opacity, 4px blur, 300ms, no overshoot), so it only animates when `added` changes.
function AddIcon({ added }: { added: boolean }) {
  const swap = "absolute inset-0 size-4 transition-[opacity,filter,scale] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
  const on = "scale-100 opacity-100 blur-0";
  const off = "scale-[0.25] opacity-0 blur-[4px]";
  return (
    <span aria-hidden className="relative size-4 shrink-0">
      <PlusIcon className={`${swap} ${added ? off : on}`} />
      <CheckIcon weight="bold" className={`${swap} ${added ? on : off}`} />
    </span>
  );
}

// The compact purchase card — split out from ProductDetailPanel (which now
// only carries the title/tabs for the left column) to match the Fable
// handoff's real structure: a focused, bordered "buy box" in the right
// rail, not everything crammed into one column.
export function ProductBuyBox({ material }: { material: BuyerMaterial }) {
  const { addItem } = useCart();
  const { selected } = useOfferSelection();
  // The picked seller offer sets the price; with no live offers it is the catalogue price.
  const price = selected?.price ?? material.catalogPrice;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleAdd() {
    addItem(
      {
        materialId: material.id,
        name: material.name,
        unit: material.unit,
        category: material.category,
        catalogPrice: material.catalogPrice,
        imageUrl: material.imageUrl,
        listingId: selected?.id ?? null,
        sellerName: selected?.seller ?? null,
        unitPrice: price,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <>
      <div className="hidden rounded-card bg-surface p-5 lg:block">
        <div className="mb-5 text-price-lg tabular-nums text-text-storefront">
          {formatNaira(price)}{" "}
          <span className="font-sans text-body-sm font-medium text-muted-foreground">
            / {material.unit}
          </span>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold text-slate">
            Quantity ({material.unit})
          </span>
          <QuantityStepper value={quantity} onChange={setQuantity} label={material.name} />
        </div>

        <div className="mb-5 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-slate">
            <span>Subtotal</span>
            <span className="font-bold tabular-nums text-ink">
              {formatNaira(price * quantity)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Delivery calculated at checkout.
          </p>
        </div>

        <Button
          type="button"
          variant="cta"
          className="mb-3 w-full gap-2"
          size="lg"
          onClick={handleAdd}
        >
          <AddIcon added={added} />
          {added ? "Added" : "Add to cart"}
        </Button>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <LockKeyIcon className="mt-0.5 size-3.5 shrink-0" />
          Suppliers are paid only after we receive your goods.
        </p>
      </div>

      {/* Phones: the buy box becomes a sticky bottom action bar (the tab bar
          is hidden on this page) plus a bottom sheet for quantity, per the
          BuyerMobileApp handoff. Pricing is a single fixed catalogue price,
          so there's no tier picker. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-hairline bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-13 shrink-0 items-center gap-2 rounded-md border border-input px-4 text-body-sm font-bold tabular-nums text-ink transition-[background-color,scale] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] active:bg-well"
        >
          Qty {quantity}
          <CaretDownIcon className="size-3.5 text-muted-foreground" />
        </button>
        <Button
          type="button"
          variant="cta"
          size="lg"
          className="flex-1 gap-2"
          onClick={handleAdd}
        >
          <AddIcon added={added} />
          {added
            ? "Added"
            : `Add to cart · ${formatNaira(price * quantity)}`}
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-panel px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] lg:hidden"
        >
          <SheetTitle className="text-heading-md text-ink">
            {material.name}
          </SheetTitle>
          <SheetDescription>
            {formatNaira(price)} / {material.unit}
          </SheetDescription>
          <div className="flex items-center justify-between gap-3">
            <span className="text-heading-sm text-ink">
              Quantity ({material.unit})
            </span>
            <QuantityStepper value={quantity} onChange={setQuantity} label={material.name} />
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-sm text-slate">
            <span>Subtotal</span>
            <span className="font-bold tabular-nums text-ink">
              {formatNaira(price * quantity)}
            </span>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => setSheetOpen(false)}
          >
            Done
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
