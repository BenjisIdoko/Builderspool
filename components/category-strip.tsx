'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { getCategoryIcon } from '@/lib/categoryIcons';

// White strip under the header: icon + category name, horizontally scrollable
// with no visible scrollbar. The active category (from ?category=) turns
// orange-text.
export function CategoryStrip({ categories }: { categories: string[] }) {
  const pathname = usePathname();
  const active = useSearchParams().get('category');

  if (categories.length === 0) return null;

  return (
    <nav aria-label="Categories" className="border-t border-hairline">
      <ul className="mx-auto flex h-[50px] max-w-section items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((name) => {
          const Icon = getCategoryIcon(name);
          const isActive = pathname.startsWith('/catalog') && active === name;
          return (
            <li key={name} className="shrink-0">
              <Link
                href={`/catalog?category=${encodeURIComponent(name)}`}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[15px] whitespace-nowrap transition-colors hover:text-orange-text ${
                  isActive ? 'font-bold text-orange-text' : 'text-text-storefront'
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} />
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
