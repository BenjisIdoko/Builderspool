'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function CategoryNav({ categories }: { categories: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={pathname}
        className={tabClass(!active)}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`${pathname}?category=${encodeURIComponent(category)}`}
          className={tabClass(active === category)}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}

function tabClass(isActive: boolean) {
  return [
    'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
    isActive
      ? 'border-ink bg-ink text-white'
      : 'border-border text-slate hover:border-ink/30 hover:text-ink',
  ].join(' ');
}
