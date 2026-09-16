import Link from 'next/link';
import { getCategories } from '@/lib/queries/materials';
import { getDemoBuyer } from '@/lib/demoBuyer';
import { CartSheet } from './cart-sheet';
import { MobileNav } from './mobile-nav';
import { HeaderSearch } from './header-search';
import { Avatar } from './avatar';
import { Logo } from './logo';

export async function SiteHeader() {
  const [categories, buyer] = await Promise.all([getCategories(), getDemoBuyer()]);
  const links = [
    { href: '/catalog', label: 'All materials' },
    ...categories.map((category) => ({
      href: `/catalog?category=${encodeURIComponent(category)}`,
      label: category,
    })),
  ];

  return (
    <div className="sticky top-4 z-10 px-4 sm:px-6">
      <header className="mx-auto max-w-7xl rounded-full border border-border bg-surface/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-6 px-4 sm:px-6">
          <MobileNav links={links} title="Builders Pool" />

          <Link href="/" className="flex shrink-0 items-center">
            <Logo />
          </Link>

          <nav className="hidden shrink-0 items-center gap-7 text-[13.5px] font-medium text-slate lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <HeaderSearch />
            <Link href="/account" aria-label="Account">
              <Avatar name={buyer.name} />
            </Link>
            <CartSheet />
          </div>
        </div>
      </header>
    </div>
  );
}
