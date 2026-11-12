'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { CaretDownIcon, GearIcon, IdentificationCardIcon, SignOutIcon, UsersThreeIcon, WalletIcon } from '@phosphor-icons/react/ssr';
import { signOutSeller } from '@/app/seller/actions';
import { Avatar } from '@/components/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// The account menu in the seller top bar: the business's avatar and first name, opening the pages
// about the account itself. Team is for the owner only.
export function SellerAccountMenu({ name, isOwner }: { name: string; isOwner: boolean }) {
  const [isPending, startTransition] = useTransition();
  const links = [
    { href: '/seller/settings', label: 'Settings', icon: GearIcon },
    { href: '/seller/kyc', label: 'KYC verification', icon: IdentificationCardIcon },
    { href: '/seller/payouts', label: 'Payouts', icon: WalletIcon },
    ...(isOwner ? [{ href: '/seller/team', label: 'Team', icon: UsersThreeIcon }] : []),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-ink outline-none transition-colors duration-150 hover:bg-well focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-well"
        >
          <Avatar name={name} className="size-[30px] text-xs" />
          <span className="max-w-32 truncate">Hi, {name.trim().split(/\s+/)[0]}</span>
          <CaretDownIcon aria-hidden className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5">
        <div className="px-3 py-2">
          <div className="truncate text-sm font-semibold text-ink">{name}</div>
          <div className="text-caption text-muted-foreground">{isOwner ? 'Owner' : 'Staff'}</div>
        </div>
        <div role="separator" className="my-1 h-px bg-border" />
        {links.map(({ href, label, icon: Icon }) => (
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
          onSelect={() => startTransition(async () => { await signOutSeller(); })}
          className="min-h-11 justify-center px-3 text-[15px] font-semibold text-orange-text"
        >
          <SignOutIcon aria-hidden className="size-5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
