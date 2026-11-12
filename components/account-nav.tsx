'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { BellIcon, IdentificationCardIcon, MapPinIcon, ReceiptIcon, SignOutIcon, SquaresFourIcon, WalletIcon } from '@phosphor-icons/react/ssr';
import { signOutBuyer } from '@/app/login/actions';

const ITEMS = [
  { href: '/account', label: 'Overview', icon: SquaresFourIcon, exact: true },
  { href: '/orders', label: 'Orders', icon: ReceiptIcon },
  { href: '/account/savings', label: 'Savings credit', icon: WalletIcon },
  { href: '/account/addresses', label: 'Address book', icon: MapPinIcon },
  { href: '/account/alerts', label: 'Price alerts', icon: BellIcon },
  { href: '/account/profile', label: 'Profile', icon: IdentificationCardIcon },
];

// The account menu: a card down the left on large screens, a row of tabs on phones and tablets.
export function AccountNav() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const isActive = (item: (typeof ITEMS)[number]) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <nav aria-label="My account" className="min-w-0 lg:sticky lg:top-44">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:rounded-card lg:bg-surface lg:p-2 lg:pb-2 lg:shadow-[0_0_0_1px_var(--color-hairline)] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded-md px-3 text-[15px] whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? 'bg-well font-semibold text-ink' : 'text-text-storefront hover:bg-well hover:text-ink'
                }`}
              >
                <Icon aria-hidden weight={active ? 'fill' : 'regular'} className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="hidden lg:mt-1 lg:block lg:border-t lg:border-hairline lg:pt-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => { await signOutBuyer(); })}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-3 text-[15px] font-semibold text-orange-text outline-none transition-colors duration-150 hover:bg-well focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <SignOutIcon aria-hidden className="size-5" />
            Log out
          </button>
        </li>
      </ul>
    </nav>
  );
}
