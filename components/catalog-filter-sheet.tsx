"use client";

import { useState } from "react";
import { FunnelIcon } from "@phosphor-icons/react/ssr";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Phone-only "Filters" button + bottom sheet (BuyerMobileApp handoff). The
// filter groups themselves are server-rendered <Link>s passed as children, so
// filtering stays URL-driven; any link tap inside the sheet closes it.
export function CatalogFilterSheet({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-10 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3.5 text-[13px] font-semibold text-ink lg:hidden"
        >
          <FunnelIcon className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-[18px] items-center justify-center rounded-full bg-brand text-[10.5px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85svh] overflow-y-auto rounded-t-[22px] px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] lg:hidden"
      >
        <SheetTitle className="text-lg font-bold text-ink">Filters</SheetTitle>
        <SheetDescription className="sr-only">
          Filter the catalogue by category and sourcing.
        </SheetDescription>
        <div
          className="flex flex-col gap-7 [&_a]:py-1.5"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
