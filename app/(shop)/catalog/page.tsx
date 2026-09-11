import { Suspense } from 'react';
import { getCategories, getMaterials } from '@/lib/queries/materials';
import { MaterialCard } from '@/components/material-card';
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {q ? `Results for “${q}”` : category ? category : 'All materials'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {materials.length} {materials.length === 1 ? 'item' : 'items'} found
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <CategoryNav categories={categories} />
      </Suspense>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {materials.map((material) => (
          <MaterialCard key={material.id} material={material} />
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
