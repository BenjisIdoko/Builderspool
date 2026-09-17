import Link from 'next/link';
import { UserCircleIcon } from '@phosphor-icons/react/ssr';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { CartSheet } from './cart-sheet';
import { MobileNav } from './mobile-nav';
import { HeaderSearch } from './header-search';
import { HeaderNavLinks } from './header-nav-links';
import { Avatar } from './avatar';

// Real page-level nav (not category browsing, which lives on the catalog
// page's own tab bar) — only used by MobileNav's sheet, since the pill's
// own desktop nav renders active state via components/header-nav-links.tsx.
const links = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/cart', label: 'Cart' },
];

export async function SiteHeader() {
  const buyer = await getCurrentBuyer();

  return (
    // Fixed, not sticky — floats over the homepage's full-bleed hero, per
    // the Fable handoff's SiteHeader spec. Every page under this layout
    // must reserve ~112px (pt-28) of top padding so content doesn't render
    // underneath it; the homepage is the one exception, since its hero is
    // deliberately full-bleed behind the floating pill.
    <div className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
      <header className="mx-auto flex h-[58px] max-w-6xl items-center justify-between gap-4 rounded-full border border-border/70 bg-surface/85 px-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)] backdrop-blur-[14px] sm:gap-6 sm:px-4.5">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-extrabold text-white">
              BP
            </span>
            <span className="hidden text-[17px] font-extrabold text-ink sm:inline">Builders Pool</span>
          </Link>

          <HeaderNavLinks />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3.5">
          <MobileNav links={links} title="Builders Pool" hideFrom="lg" />
          <HeaderSearch />
          {buyer ? (
            <Link href="/account" aria-label="Account">
              <Avatar name={buyer.name} className="size-8" />
            </Link>
          ) : (
            <Link href="/login" aria-label="Sign in" className="text-slate hover:text-ink">
              <UserCircleIcon className="size-6" />
            </Link>
          )}
          <CartSheet />
        </div>
      </header>
    </div>
  );
}
