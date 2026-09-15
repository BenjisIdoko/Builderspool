'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GaugeIcon, MapPinIcon, SignOutIcon, StackIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { signOutSeller } from '@/app/seller/actions';
import type { getSellerProfile } from '@/lib/queries/sellerPortal';
import { LogoMark } from '@/components/logo';
import { Button } from '@/components/ui/button';

const LINKS = [
  { href: '/seller', label: 'Open cycles', icon: GaugeIcon },
  { href: '/seller/bids', label: 'My bids', icon: StackIcon },
  { href: '/seller/allocations', label: 'Allocations', icon: TruckIcon },
];

export function SellerSidebar({
  profile,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getSellerProfile>>>;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <Link href="/seller" className="flex items-center gap-2 border-b border-border px-5 py-5">
        <LogoMark className="size-8" />
        <span className="text-[15px] font-medium tracking-tight text-ink">Seller portal</span>
      </Link>

      <nav className="flex flex-col gap-1 p-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-brand/10 text-brand' : 'text-slate hover:bg-well hover:text-ink'
              }`}
            >
              <link.icon className="size-4.5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border p-4">
        <div className="mb-1 text-sm font-semibold text-ink">
          {profile.user.businessName ?? profile.user.name}
        </div>
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5" />
          {profile.regionsServed.join(', ')}
        </div>
        <form action={signOutSeller}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 px-2">
            <SignOutIcon className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
