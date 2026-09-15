import { Suspense } from 'react';
import Link from 'next/link';
import { getCategories, getMaterials } from '@/lib/queries/materials';
import { formatNaira } from '@/lib/format';
import { MaterialImage } from '@/components/material-image';
import { CategoryNav } from '@/components/category-nav';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [categories, materials] = await Promise.all([
    getCategories(),
    getMaterials(category, q),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {q ? `Results for “${q}”` : category ? category : 'Catalogue'}
        </h1>
        <span className="text-xs text-muted-foreground">
          {materials.length} {materials.length === 1 ? 'material' : 'materials'}
        </span>
      </div>
      <p className="mb-8 text-sm text-slate">Fixed catalogue price. Delivery or pickup calculated at checkout.</p>

      <Suspense fallback={null}>
        <CategoryNav categories={categories} />
      </Suspense>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3">
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

      {materials.length === 0 && (
        <div className="mt-10 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {q ? `No materials match "${q}".` : 'No materials in this category yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
