import Link from 'next/link';
import { getCategories, getMaterials } from '@/lib/queries/materials';
import { MaterialCard } from '@/components/material-card';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const [categories, materials] = await Promise.all([getCategories(), getMaterials()]);
  const featured = materials.slice(0, 8);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20">
          <h1 className="max-w-xl text-4xl font-medium leading-tight tracking-tight text-ink">
            Construction materials, delivered at a fair price.
          </h1>
          <p className="max-w-md text-slate">
            Browse cement, blocks, rebar, roofing and fittings. Pick up at a fulfillment center or
            get it delivered to site.
          </p>
          <div>
            <Button asChild size="lg">
              <Link href="/catalog">Browse the catalog</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <h2 className="mb-5 text-sm font-medium text-slate">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/catalog?category=${encodeURIComponent(category)}`}
              className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm font-medium text-ink transition-colors hover:border-ink/20"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-slate">Popular materials</h2>
          <Link href="/catalog" className="text-sm text-brand hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      </section>
    </div>
  );
}
