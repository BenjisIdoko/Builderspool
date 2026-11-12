'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { BellIcon, CaretDownIcon, MapPinIcon, ReceiptIcon, SignOutIcon, UserIcon, WalletIcon } from '@phosphor-icons/react/ssr';
import { signOutBuyer } from '@/app/login/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const LINKS = [
  { href: '/account', label: 'My account', icon: UserIcon },
  { href: '/orders', label: 'Orders', icon: ReceiptIcon },
  { href: '/account/savings', label: 'Savings credit', icon: WalletIcon },
  { href: '/account/addresses', label: 'Address book', icon: MapPinIcon },
  { href: '/account/alerts', label: 'Price alerts', icon: BellIcon },
];

// "Hi, Name" with a menu of the places a buyer goes most. The menu is for mouse and keyboard on
// larger screens; phones use the Account tab at the bottom.
export function AccountMenu({ firstName }: { firstName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group hidden min-h-11 items-center gap-1.5 rounded-md px-2 text-[15px] font-medium text-text-storefront outline-none transition-colors duration-150 hover:text-orange-text focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-well md:inline-flex"
        >
          <UserIcon aria-hidden className="size-5" />
          Hi, {firstName}
          <CaretDownIcon aria-hidden className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild className="min-h-11 px-3 text-[15px]">
            <Link href={href}>
              <Icon aria-hidden className="size-5" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <div role="separator" className="my-1 h-px bg-border" />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={() => startTransition(async () => { await signOutBuyer(); })}
          className="min-h-11 justify-center px-3 text-[15px] font-semibold text-orange-text"
        >
          <SignOutIcon aria-hidden className="size-5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
