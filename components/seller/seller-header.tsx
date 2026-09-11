import Link from 'next/link';
import { signOutSeller } from '@/app/seller/actions';
import type { getSellerProfile } from '@/lib/queries/sellerPortal';

export function SellerHeader({ profile }: { profile: NonNullable<Awaited<ReturnType<typeof getSellerProfile>>> }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/seller" className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-ink"
            >
              B
            </span>
            <span className="text-[15px] font-medium tracking-tight text-ink">Seller portal</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate sm:flex">
            <Link href="/seller" className="transition-colors hover:text-ink">
              Open cycles
            </Link>
            <Link href="/seller/bids" className="transition-colors hover:text-ink">
              My bids
            </Link>
            <Link href="/seller/allocations" className="transition-colors hover:text-ink">
              Allocations
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate sm:inline">
            {profile.user.businessName ?? profile.user.name}
          </span>
          <form action={signOutSeller}>
            <button type="submit" className="text-sm text-slate hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
