'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function CategoryNav({ categories }: { categories: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant={!active ? 'default' : 'outline'} className="rounded-full">
        <Link href={pathname}>All</Link>
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          asChild
          variant={active === category ? 'default' : 'outline'}
          className="rounded-full"
        >
          <Link href={`${pathname}?category=${encodeURIComponent(category)}`}>{category}</Link>
        </Button>
      ))}
    </div>
  );
}
