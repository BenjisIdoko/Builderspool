import Link from 'next/link';
import { TruckIcon } from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories, getFulfillmentCenters, MATERIAL_SORT_VALUES, type MaterialSort } from '@/lib/queries/materials';
import { formatNaira } from '@/lib/format';
import { MaterialImage } from '@/components/material-image';
import { CatalogSortSelect } from '@/components/catalog-sort-select';

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

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-semibold text-slate">Catalogue</div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
            {q ? `Results for "${q}"` : category ? category : 'Building materials'}
          </h1>
        </div>
        {regions.length > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
            <TruckIcon className="size-3.5" />
            Delivery available — {regions.map((r) => r.charAt(0) + r.slice(1).toLowerCase()).join(', ')}
          </span>
        )}
      </div>
      <p className="mb-8 text-sm text-slate">Fixed catalogue price, {total} materials.</p>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">Category</h2>
            <div className="flex flex-col gap-1">
              <Link
                href={urlFor({ category: '', page: 1 })}
                className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  !category ? 'bg-well font-semibold text-ink' : 'text-slate hover:bg-well hover:text-ink'
                }`}
              >
                All materials
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.name}
                  href={urlFor({ category: c.name, page: 1 })}
                  className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    category === c.name ? 'bg-well font-semibold text-ink' : 'text-slate hover:bg-well hover:text-ink'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-bold tracking-wide text-slate uppercase">Sourcing</h2>
            <div className="flex flex-col gap-1">
              {SCOPE_OPTIONS.map((opt) => (
                <Link
                  key={opt.label}
                  href={urlFor({ scope: opt.value ?? '', page: 1 })}
                  className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    sourcingScope === opt.value ? 'bg-well font-semibold text-ink' : 'text-slate hover:bg-well hover:text-ink'
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <span className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'result' : 'results'}
            </span>
            <CatalogSortSelect sort={sort} category={category} q={q} scope={sourcingScope} />
          </div>

          {materials.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {q ? `No materials match "${q}".` : 'No materials in this category yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/catalog/${material.id}`}
                  className="group border-t border-r border-border p-6"
                >
                  <div className="relative mb-4 overflow-hidden">
                    <MaterialImage
                      imageUrl={material.imageUrl}
                      category={material.category}
                      alt={material.name}
                      className="aspect-[5/4] w-full transition-[filter] duration-150 group-hover:brightness-[.96]"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-white/92 px-2.5 py-1 text-[10.5px] font-semibold text-slate">
                      {material.sourcingScope === 'NATIONAL' ? 'National supply' : 'Regional'}
                    </span>
                  </div>
                  <div className="mb-2 text-[15px] font-semibold text-ink">{material.name}</div>
                  <div className="text-base font-semibold text-ink">
                    {formatNaira(material.catalogPrice)}
                    <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">/ {material.unit}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {page} of {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={urlFor({ page: page - 1 })} className="rounded-md border border-border px-3 py-1.5 hover:bg-well hover:text-ink">
                    Previous
                  </Link>
                )}
                {page < pageCount && (
                  <Link href={urlFor({ page: page + 1 })} className="rounded-md border border-border px-3 py-1.5 hover:bg-well hover:text-ink">
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
