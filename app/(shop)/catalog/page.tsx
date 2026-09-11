import { Suspense } from 'react';
import { getCategories, getMaterials } from '@/lib/queries/materials';
import { MaterialCard } from '@/components/material-card';
import { CategoryNav } from '@/components/category-nav';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, materials] = await Promise.all([getCategories(), getMaterials(category)]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-medium tracking-tight text-ink">Catalog</h1>

      <Suspense fallback={null}>
        <CategoryNav categories={categories} />
      </Suspense>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {materials.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>

      {materials.length === 0 && (
        <p className="mt-10 text-sm text-muted">No materials in this category yet.</p>
      )}
    </div>
  );
}
