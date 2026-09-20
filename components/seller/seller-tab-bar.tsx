'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartBarIcon, StackIcon, ClipboardTextIcon, WalletIcon } from '@phosphor-icons/react';

// Bottom tab bar for the seller console on phones (SellerMobileApp handoff:
// Dashboard / Listings / Orders / Payouts). Sellers here have no durable
// "listings" (see the brief) — their equivalent is bidding — so that tab is
// "My bids". Settings sits under the header avatar, and is a pushed screen
// with no tab bar, like the prototype.
const TABS = [
  { href: '/seller', label: 'Dashboard', icon: ChartBarIcon, match: (p: string) => p === '/seller' },
  { href: '/seller/bids', label: 'My bids', icon: StackIcon, match: (p: string) => p.startsWith('/seller/bids') },
  { href: '/seller/orders', label: 'Orders', icon: ClipboardTextIcon, match: (p: string) => p.startsWith('/seller/orders') },
  { href: '/seller/payouts', label: 'Payouts', icon: WalletIcon, match: (p: string) => p.startsWith('/seller/payouts') },
];

export function SellerTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/seller/settings')) return null;

  return (
    <>
      {/* Reserves room so the fixed bar never covers page content. */}
      <div aria-hidden className="h-[calc(64px+env(safe-area-inset-bottom))] lg:hidden" />
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
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-[3px] text-[10px] font-bold ${active ? 'text-brand' : 'text-muted-foreground'}`}
            >
              <Icon weight={active ? 'fill' : 'regular'} className="size-[22px]" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
