'use client';

import { useRouter } from 'next/navigation';
import type { MaterialSort } from '@/lib/queries/materials';

const SORT_OPTIONS: { value: MaterialSort; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
  { value: 'name', label: 'Name A–Z' },
];

// Functions (a URL-builder) can't cross the server->client boundary as
// props, so this takes the plain filter state instead and builds the URL
// itself — the same simple logic the server page already has, just
// duplicated on the client side of this one control.
export function CatalogSortSelect({
  sort,
  category,
  q,
  scope,
}: {
  sort: MaterialSort;
  category?: string;
  q?: string;
  scope?: string;
}) {
  const router = useRouter();

  function buildUrl(nextSort: MaterialSort) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    if (nextSort !== 'relevance') params.set('sort', nextSort);
    if (scope) params.set('scope', scope);
    const qs = params.toString();
    return `/catalog${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs text-muted-foreground">
        Sort
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(e) => router.push(buildUrl(e.target.value as MaterialSort))}
        className="h-8 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
