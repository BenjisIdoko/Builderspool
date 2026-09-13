import Link from 'next/link';
import { signOutSeller } from '@/app/seller/actions';
import type { getSellerProfile } from '@/lib/queries/sellerPortal';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/logo';
import { MobileNav } from '@/components/mobile-nav';

const LINKS = [
  { href: '/seller', label: 'Open cycles' },
  { href: '/seller/bids', label: 'My bids' },
  { href: '/seller/allocations', label: 'Allocations' },
];

export function SellerHeader({ profile }: { profile: NonNullable<Awaited<ReturnType<typeof getSellerProfile>>> }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <MobileNav links={LINKS} title="Seller portal" hideFrom="sm" />

          <Link href="/seller" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="text-[15px] font-medium tracking-tight text-ink">Seller portal</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate sm:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate sm:inline">
            {profile.user.businessName ?? profile.user.name}
          </span>
          <form action={signOutSeller}>
            <Button type="submit" variant="ghost">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
