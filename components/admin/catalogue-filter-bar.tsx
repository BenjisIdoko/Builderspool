'use client';

import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  function handleCategoryChange(value: string) {
    const params = new URLSearchParams();
    if (value !== 'all') params.set('category', value);
    if (q) params.set('q', q);
    const qs = params.toString();
    router.push(`/admin/catalogue-reference${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Select value={category ?? 'all'} onValueChange={handleCategoryChange}>
        <SelectTrigger aria-label="Category" className="min-w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name} ({c.productCount})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
