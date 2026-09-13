import Image from 'next/image';
import Link from 'next/link';
import { createElement } from 'react';
import { TagIcon, TruckIcon, MapPinIcon, WarehouseIcon } from '@phosphor-icons/react/ssr';
import { getCategories, getMaterials } from '@/lib/queries/materials';
import { getStorefrontStats } from '@/lib/queries/stats';
import { MaterialCard } from '@/components/material-card';
import { Button } from '@/components/ui/button';
import { getCategoryIcon } from '@/lib/categoryIcons';

const FEATURES = [
  { icon: TagIcon, title: 'Fixed price at checkout', body: 'Your rate is locked the moment you pay — never renegotiated.' },
  { icon: TruckIcon, title: 'Pickup or delivery', body: 'Choose at checkout. Every order routes through a fulfillment center.' },
  { icon: MapPinIcon, title: 'Nationwide & regional', body: 'Some materials ship anywhere, others source close to your site.' },
  { icon: WarehouseIcon, title: 'Real fulfillment centers', body: 'Not a drop-shipper — materials move through staffed hubs.' },
];

export default async function Home() {
  const [categories, materials, stats] = await Promise.all([
    getCategories(),
    getMaterials(),
    getStorefrontStats(),
  ]);
  const featured = materials.slice(0, 8);

  const categoryImages = new Map<string, string>();
  const categoryCounts = new Map<string, number>();
  for (const material of materials) {
    categoryCounts.set(material.category, (categoryCounts.get(material.category) ?? 0) + 1);
    if (material.imageUrl && !categoryImages.has(material.category)) {
      categoryImages.set(material.category, material.imageUrl);
    }
  }
  const featuredCategory = categories.find((c) => categoryImages.has(c)) ?? categories[0];
  const restCategories = categories.filter((c) => c !== featuredCategory);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex min-h-[80svh] items-center overflow-hidden border-b border-border">
        {/* Signature duotone: the brand's blue->indigo->amber gradient mapped
            onto the photo's luminosity via mix-blend-color, rather than a
            generic dark scrim. This is the one deliberately bold color
            moment on the site — reserved for the hero only, not repeated on
            routine controls. */}
        <div className="absolute inset-0">
          <Image
            src="/materials/cement.jpg"
            alt="Cement bag staged on a pallet in a fulfillment warehouse"
            fill
            sizes="100vw"
            className="object-cover grayscale contrast-125"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-deep to-brand-warm mix-blend-color" />
          {/* Darkening is directional, not flat — strongest where the
              headline sits (top-left) and fading out toward the amber
              corner, so the copy stays legible without muting the gradient
              everywhere. */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/60 to-ink/20" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:py-24">
          <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Construction materials,{' '}
            <span className="bg-gradient-to-r from-[#8fb4ff] to-[#fdba74] bg-clip-text text-transparent">
              delivered at a fair price.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/80">
            Cement, blocks, rebar, roofing and fittings — one fixed price, no back-and-forth.
            Pick up at a fulfillment center or get it delivered to site.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/catalog">Browse the catalog</Link>
            </Button>
          </div>

          {/* In normal flow (stacked below the CTA) on mobile so it never
              overlaps the button; floats over the photo's corner from sm+
              where there's enough room. */}
          <div className="relative mt-8 w-full max-w-xs overflow-hidden rounded-xl border border-white/15 bg-ink/40 p-4 text-white shadow-2xl backdrop-blur-md sm:absolute sm:right-0 sm:bottom-0 sm:mt-0 sm:w-60">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-brand-deep to-brand-warm" />
            <div className="text-xs font-medium text-white/70">Live on the platform</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              {stats.materialCount}+ <span className="text-base font-medium text-white/80">materials</span>
            </div>
            <div className="mt-0.5 text-sm text-white/70">
              across {stats.fulfillmentCenterCount} fulfillment hubs
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-well">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How Builders Pool works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="relative">
                <span className="font-display text-4xl font-bold text-brand/15">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mt-2 flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <div className="mt-4 text-base font-semibold text-ink">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="mb-8 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Shop by category
        </h2>
        <div className="grid auto-rows-[9.5rem] grid-cols-2 gap-4 sm:grid-cols-4">
          <CategoryTile
            category={featuredCategory}
            count={categoryCounts.get(featuredCategory) ?? 0}
            imageUrl={categoryImages.get(featuredCategory)}
            className="col-span-2 row-span-2"
            large
          />
          {restCategories.map((category) => (
            <CategoryTile
              key={category}
              category={category}
              count={categoryCounts.get(category) ?? 0}
              imageUrl={categoryImages.get(category)}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Popular materials
          </h2>
          <Link href="/catalog" className="text-sm font-medium text-brand hover:underline">
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

function CategoryTile({
  category,
  count,
  imageUrl,
  className = '',
  large = false,
}: {
  category: string;
  count: number;
  imageUrl?: string;
  className?: string;
  large?: boolean;
}) {
  if (imageUrl) {
    return (
      <Link
        href={`/catalog?category=${encodeURIComponent(category)}`}
        className={`group relative overflow-hidden rounded-lg border border-border ${className}`}
      >
        <Image
          src={imageUrl}
          alt={category}
          fill
          sizes={large ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className={`font-semibold text-white ${large ? 'text-xl' : 'text-sm'}`}>{category}</div>
          <div className="text-xs text-white/75">
            {count} {count === 1 ? 'item' : 'items'}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/catalog?category=${encodeURIComponent(category)}`}
      className={`flex flex-col items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-4 text-center transition-colors hover:border-border-strong ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-well text-brand">
        {createElement(getCategoryIcon(category), { className: 'size-4.5' })}
      </span>
      <span className="text-sm font-medium text-ink">{category}</span>
      <span className="text-xs text-muted-foreground">
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    </Link>
  );
}
