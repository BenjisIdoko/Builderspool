'use client';

import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Category = { slug: string; name: string; productCount: number };

// Replaces a 17-pill wall (one badge per category) with a proper dropdown —
// same filtering power, without the clutter of 17 tap targets on screen at
// once.
export function CatalogueFilterBar({
  categories,
  category,
  q,
}: {
  categories: Category[];
  category?: string;
  q?: string;
}) {
  const router = useRouter();

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (e.target.value) params.set('category', e.target.value);
    if (q) params.set('q', q);
    const qs = params.toString();
    router.push(`/admin/catalogue-reference${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={category ?? ''}
        onChange={handleCategoryChange}
        className="h-8 min-w-52 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name} ({c.productCount})
          </option>
        ))}
      </select>

      <form className="flex max-w-sm flex-1 items-center gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search name, SKU, or brand…" className="pl-9" />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
    </div>
  );
}
