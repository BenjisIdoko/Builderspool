import Image from 'next/image';
import Link from 'next/link';
import { Tag, Truck, MapPin, Warehouse } from 'lucide-react';
import { getCategories, getMaterials } from '@/lib/queries/materials';
import { getStorefrontStats } from '@/lib/queries/stats';
import { MaterialCard } from '@/components/material-card';
import { Button } from '@/components/ui/button';
import { getCategoryIcon } from '@/lib/categoryIcons';

const FEATURES = [
  { icon: Tag, title: 'Fixed price at checkout', body: 'Your rate is locked the moment you pay — never renegotiated.' },
  { icon: Truck, title: 'Pickup or delivery', body: 'Choose at checkout. Every order routes through a fulfillment center.' },
  { icon: MapPin, title: 'Nationwide & regional', body: 'Some materials ship anywhere, others source close to your site.' },
  { icon: Warehouse, title: 'Real fulfillment centers', body: 'Not a drop-shipper — materials move through staffed hubs.' },
];

export default async function Home() {
  const [categories, materials, stats] = await Promise.all([
    getCategories(),
    getMaterials(),
    getStorefrontStats(),
  ]);
  const featured = materials.slice(0, 8);

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

      <div className="border-b border-border bg-surface/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-6 sm:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4.5 shrink-0 text-brand" />
              <div>
                <div className="text-sm font-semibold text-ink">{title}</div>
                <div className="text-xs text-muted-foreground">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-6 py-14">
        <h2 className="mb-5 text-sm font-bold text-slate">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <Link
                key={category}
                href={`/catalog?category=${encodeURIComponent(category)}`}
                className="flex flex-col items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-6 text-center transition-colors hover:border-border-strong"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-well text-brand">
                  <Icon className="size-4.5" />
                </span>
                <span className="text-sm font-medium text-ink">{category}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-slate">Popular materials</h2>
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
