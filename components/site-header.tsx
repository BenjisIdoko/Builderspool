import Link from 'next/link';
import { UserIcon } from '@phosphor-icons/react/ssr';
import { getCategories } from '@/lib/queries/materials';
import { CartSheet } from './cart-sheet';
import { MobileNav } from './mobile-nav';
import { Logo } from './logo';

export async function SiteHeader() {
  const categories = await getCategories();
  const links = [
    { href: '/catalog', label: 'All materials' },
    ...categories.map((category) => ({
      href: `/catalog?category=${encodeURIComponent(category)}`,
      label: category,
    })),
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
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
          <Link
            href="/account"
            className="flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-ink"
          >
            <UserIcon className="size-4.5" />
            <span className="hidden sm:inline">Account</span>
          </Link>
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
