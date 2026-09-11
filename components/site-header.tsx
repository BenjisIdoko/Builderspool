import Link from 'next/link';
import { CartLink } from './cart-link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-ink"
          >
            B
          </span>
          <span className="text-[15px] font-medium tracking-tight text-ink">
            Builders<span className="text-slate">Pool</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate sm:flex">
          <Link href="/catalog" className="transition-colors hover:text-ink">
            Catalog
          </Link>
          <Link href="/catalog?category=Cement" className="transition-colors hover:text-ink">
            Cement
          </Link>
          <Link href="/catalog?category=Rebar" className="transition-colors hover:text-ink">
            Rebar
          </Link>
        </nav>

        <CartLink />
      </div>
    </header>
  );
}
