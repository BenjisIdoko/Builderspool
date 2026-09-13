'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function CategoryNav({ categories }: { categories: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  const tabs = [{ label: 'All', href: pathname, isActive: !active }, ...categories.map((category) => ({
    label: category,
    href: `${pathname}?category=${encodeURIComponent(category)}`,
    isActive: active === category,
  }))];

  return (
    <div className="flex gap-7 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={`shrink-0 border-b-2 pb-3.5 text-sm font-medium whitespace-nowrap ${
            tab.isActive ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
