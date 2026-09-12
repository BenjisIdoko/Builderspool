import Link from 'next/link';
import { Search } from 'lucide-react';
import { getCategories } from '@/lib/queries/materials';
import { Input } from '@/components/ui/input';
import { CartSheet } from './cart-sheet';
import { Logo } from './logo';

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo />
        </Link>

        <nav className="hidden shrink-0 items-center gap-6 text-sm font-medium text-slate lg:flex">
          <Link href="/catalog" className="transition-colors hover:text-ink">
            All materials
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/catalog?category=${encodeURIComponent(category)}`}
              className="transition-colors hover:text-ink"
            >
              {category}
            </Link>
          ))}
        </nav>

        <form action="/catalog" method="get" className="relative hidden flex-1 max-w-md md:block">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            type="search"
            placeholder="Search materials…"
            className="h-9 pl-8"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
