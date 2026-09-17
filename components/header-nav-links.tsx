'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/cart', label: 'Cart' },
];

export function HeaderNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-5 lg:flex">
      {LINKS.map((link) => {
        const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-semibold transition-colors ${active ? 'text-brand' : 'text-slate hover:text-ink'}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
