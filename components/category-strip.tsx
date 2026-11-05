'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

// White strip under the header: category names only (DESIGN.md v3.0 6.7),
// horizontally scrollable with no visible scrollbar. The active category
// (from ?category=) gets a 2px orange underline.
export function CategoryStrip({ categories }: { categories: string[] }) {
  const pathname = usePathname();
  const active = useSearchParams().get('category');

  if (categories.length === 0) return null;

  return (
    <nav aria-label="Categories" className="border-t border-hairline">
      <ul className="mx-auto flex h-12 max-w-section items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((name) => {
          const isActive = pathname.startsWith('/catalog') && active === name;
          return (
            <li key={name} className="shrink-0">
              <Link
                href={`/catalog?category=${encodeURIComponent(name)}`}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-12 items-center border-b-2 px-3 text-body-sm font-medium whitespace-nowrap transition-colors hover:text-orange-text ${
                  isActive ? 'border-cta text-ink' : 'border-transparent text-text-storefront'
                }`}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
