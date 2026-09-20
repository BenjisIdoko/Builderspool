"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HouseIcon,
  SquaresFourIcon,
  ShoppingCartIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useCart } from "@/lib/cart/CartContext";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: HouseIcon,
    match: (p: string) => p === "/",
  },
  {
    href: "/catalog",
    label: "Catalog",
    icon: SquaresFourIcon,
    match: (p: string) => p.startsWith("/catalog"),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingCartIcon,
    match: (p: string) => p.startsWith("/cart"),
  },
  {
    href: "/account",
    label: "Account",
    icon: UserIcon,
    match: (p: string) => p.startsWith("/account"),
  },
];

// Native-style bottom tab bar for phones (per the BuyerMobileApp handoff).
// Hidden on pushed screens — product detail and checkout — like the
// prototype, where those have their own sticky action bar / back button.
export function MobileTabBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const hidden =
    pathname.startsWith("/checkout") || /^\/catalog\/[^/]+/.test(pathname);
  if (hidden) return null;

  return (
    <>
      {/* Reserves room so the fixed bar never covers the footer. */}
      <div
        aria-hidden
        className="h-[calc(64px+env(safe-area-inset-bottom))] lg:hidden"
      />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 px-1.5 pt-2 pb-[calc(4px+env(safe-area-inset-bottom))] backdrop-blur-[10px] lg:hidden"
      >
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-12 flex-1 flex-col items-center justify-center gap-[3px] text-[10.5px] font-bold ${active ? "text-brand" : "text-muted-foreground"}`}
            >
              <Icon
                weight={active ? "fill" : "regular"}
                className="size-[22px]"
              />
              {label}
              {label === "Cart" && itemCount > 0 && (
                <span className="absolute top-0.5 left-1/2 ml-2.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-brand px-[3px] text-[9px] font-extrabold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
