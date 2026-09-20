import Link from 'next/link';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { CartSheet } from './cart-sheet';
import { HeaderSearch } from './header-search';
import { HeaderNavLinks } from './header-nav-links';
import { Avatar } from './avatar';
import { Button } from './ui/button';
import { LogoMark } from './logo';

export async function SiteHeader() {
  const buyer = await getCurrentBuyer();

  return (
    // Fixed, not sticky — floats over the homepage's full-bleed hero, per
    // the Fable handoff's SiteHeader spec. Every page under this layout
    // must reserve 112px (pt-28) of top padding so content doesn't render
    // underneath it; the homepage is the one exception, since its hero is
    // deliberately full-bleed behind the floating pill.
    <div className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
      <header className="mx-auto flex h-[58px] max-w-section items-center justify-between gap-4 rounded-full border border-border/70 bg-surface/85 px-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)] backdrop-blur-[14px] sm:gap-6 sm:px-4.5">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <LogoMark className="size-7 shrink-0" />
            <span className="hidden text-[1.5rem] leading-none font-extrabold sm:inline">
              <span className="text-ink">Builders</span> <span className="text-brand">Pool</span>
            </span>
          </Link>

          <HeaderNavLinks />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3.5">
          <HeaderSearch />
          {buyer ? (
            <div className="hidden items-center gap-1 sm:gap-3.5 lg:flex">
              <Link href="/account" aria-label="Account">
                <Avatar name={buyer.name} className="size-8" />
              </Link>
              <CartSheet />
            </div>
          ) : (
            <div className="hidden items-center gap-3.5 lg:flex">
              <Link href="/login" className="px-1 text-sm font-semibold text-slate hover:text-ink">
                Log in
              </Link>
              <Button asChild size="sm" className="h-[34px] rounded-full px-4.5 text-[13.5px] font-bold">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
