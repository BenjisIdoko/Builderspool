import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state/empty-state';
import { NoResultsIllustration } from '@/components/empty-state/illustrations';
import Link from 'next/link';
import { TruckIcon } from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories, getFulfillmentCenters, MATERIAL_SORT_VALUES, type MaterialSort } from '@/lib/queries/materials';
import { MaterialCard } from '@/components/material-card';
import { CatalogSortSelect } from '@/components/catalog-sort-select';
import { CatalogFilterSheet } from '@/components/catalog-filter-sheet';

export const metadata = { title: 'Catalogue' };

const PAGE_SIZE = 24;

const SCOPE_OPTIONS: { value: 'NATIONAL' | 'REGIONAL' | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'NATIONAL', label: 'National supply' },
  { value: 'REGIONAL', label: 'Regional' },
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; scope?: string; page?: string }>;
}) {
  const { category, q, sort: sortParam, scope: scopeParam, page: pageParam } = await searchParams;
  const sort: MaterialSort = MATERIAL_SORT_VALUES.includes(sortParam as MaterialSort) ? (sortParam as MaterialSort) : 'relevance';
  const sourcingScope = scopeParam === 'NATIONAL' || scopeParam === 'REGIONAL' ? scopeParam : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  const [categories, centers, { materials, total, pageCount }] = await Promise.all([
    getCategories(),
    getFulfillmentCenters(),
    getMaterials({ category, query: q, sort, sourcingScope, page, pageSize: PAGE_SIZE }),
  ]);
  const regions = [...new Set(centers.map((c) => c.region))];

  function urlFor(overrides: { category?: string; sort?: MaterialSort; scope?: string; page?: number }) {
    const params = new URLSearchParams();
    const c = overrides.category !== undefined ? overrides.category : category;
    const s = overrides.sort ?? sort;
    const sc = overrides.scope !== undefined ? overrides.scope : sourcingScope;
    const p = overrides.page ?? 1;
    if (c) params.set('category', c);
    if (q) params.set('q', q);
    if (s !== 'relevance') params.set('sort', s);
    if (sc) params.set('scope', sc);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/catalog${qs ? `?${qs}` : ''}`;
  }

  const filterGroups = (
    <>
          <div>
            <h2 className="mb-3 text-label text-slate uppercase">Category</h2>
            <div className="flex flex-col gap-2.5">
              <Link
                href={urlFor({ category: '', page: 1 })}
                aria-current={!category ? 'true' : undefined}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink"
              >
                <input type="radio" readOnly aria-hidden="true" tabIndex={-1} checked={!category} className="size-3.5 accent-brand" />
                All materials
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.name}
                  href={urlFor({ category: c.name, page: 1 })}
                  aria-current={category === c.name ? 'true' : undefined}
                  className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                >
                  <input type="radio" readOnly aria-hidden="true" tabIndex={-1} checked={category === c.name} className="size-3.5 accent-brand" />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-[11.5px] text-muted-foreground/70">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-label text-slate uppercase">Sourcing</h2>
            <div className="flex flex-col gap-2.5">
              {SCOPE_OPTIONS.map((opt) => (
                <Link
                  key={opt.label}
                  href={urlFor({ scope: opt.value ?? '', page: 1 })}
                  aria-current={sourcingScope === opt.value ? 'true' : undefined}
                  className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                >
                  <input type="radio" readOnly aria-hidden="true" tabIndex={-1} checked={sourcingScope === opt.value} className="size-3.5 accent-brand" />
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
    </>
  );
  const activeFilterCount = (category ? 1 : 0) + (sourcingScope ? 1 : 0);

  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-10">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-label text-slate uppercase">Catalogue</div>
          <h1 className="text-ink">
            {q ? `Results for "${q}"` : category ? category : 'Building materials'}
          </h1>
        </div>
        {regions.length > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-caption font-semibold text-success">
            <TruckIcon className="size-3.5" />
            Delivery available — {regions.map((r) => r.charAt(0) + r.slice(1).toLowerCase()).join(', ')}
          </span>
        )}
      </div>
      <p className="mb-8 text-body-sm text-slate">Fixed catalogue price, {total} materials.</p>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[240px_1fr]">
        <aside className="hidden flex-col gap-8 rounded-card bg-surface p-5 lg:sticky lg:top-44 lg:flex lg:self-start">
          {filterGroups}
        </aside>

        <div>
          {/* Phones: category chips (horizontal scroll) above the results. */}
          <div className="-mx-6 mb-4 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
            {[{ name: '', label: 'All' }, ...categories.map((c) => ({ name: c.name, label: c.name }))].map((c) => (
              <Link
                key={c.label}
                href={urlFor({ category: c.name, page: 1 })}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-body-sm font-medium whitespace-nowrap ${
                  (category ?? '') === c.name ? 'border-brand bg-brand text-brand-ink' : 'border-input bg-surface text-ink'
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <span className="text-label text-muted-foreground uppercase">
              {total} {total === 1 ? 'result' : 'results'}
            </span>
            <div className="flex items-center gap-2">
              <CatalogFilterSheet activeCount={activeFilterCount}>{filterGroups}</CatalogFilterSheet>
              <CatalogSortSelect sort={sort} category={category} q={q} scope={sourcingScope} />
            </div>
          </div>

          {materials.length === 0 ? (
            <div className="rounded-lg bg-surface">
              <EmptyState
                illustration={NoResultsIllustration}
                variant="inline"
                title={q ? `No materials match "${q}"` : 'No materials in this category yet'}
                description={q ? 'Check the spelling or try a broader term.' : 'Try another category, or browse everything.'}
              >
                <Button asChild variant="outline">
                  <Link href="/catalog">Clear filters</Link>
                </Button>
              </EmptyState>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3 xl:grid-cols-4">
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} showScope />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {page > 1 && (
                <Link
                  href={urlFor({ page: page - 1 })}
                  aria-label="Previous page"
                  className="flex size-8 items-center justify-center rounded-lg bg-surface text-ink hover:bg-well"
                >
                  ‹
                </Link>
              )}
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-sm text-muted-foreground">…</span>}
                    <Link
                      href={urlFor({ page: p })}
                      aria-current={p === page ? 'page' : undefined}
                      className={`flex size-11 items-center justify-center rounded-md border text-body-sm font-bold ${
                        p === page
                          ? 'border-brand bg-brand text-brand-ink'
                          : 'border-input bg-surface text-ink hover:bg-well'
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {page < pageCount && (
                <Link
                  href={urlFor({ page: page + 1 })}
                  aria-label="Next page"
                  className="flex size-8 items-center justify-center rounded-lg bg-surface text-ink hover:bg-well"
                >
                  ›
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
