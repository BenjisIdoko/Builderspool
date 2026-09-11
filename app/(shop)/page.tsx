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
      <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(ellipse_90%_80%_at_50%_-20%,rgba(15,98,254,0.10),transparent_60%)] bg-canvas">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <div className="flex flex-col gap-6">
            <h1 className="max-w-xl text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
              Construction materials,{' '}
              <span className="bg-gradient-to-r from-brand to-[#0043ce] bg-clip-text text-transparent">
                delivered at a fair price.
              </span>
            </h1>
            <p className="max-w-lg text-lg text-slate">
              Cement, blocks, rebar, roofing and fittings — one fixed price, no back-and-forth.
              Pick up at a fulfillment center or get it delivered to site.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href="/catalog">Browse the catalog</Link>
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full max-w-lg justify-self-center lg:justify-self-end">
            <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]">
              <Image
                src="/materials/cement.jpg"
                alt="Cement bag staged on a pallet in a fulfillment warehouse"
                fill
                sizes="(max-width: 1024px) 90vw, 500px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-brand/10" />
            </div>

            <div className="absolute bottom-3 left-3 w-48 rounded-xl border border-border bg-surface/95 p-3.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)] backdrop-blur-sm sm:-bottom-6 sm:-left-10 sm:w-56 sm:p-4">
              <div className="text-xs font-medium text-muted-foreground">Live on the platform</div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
                {stats.materialCount}+ <span className="text-base font-medium text-slate">materials</span>
              </div>
              <div className="mt-0.5 text-sm text-slate">
                across {stats.fulfillmentCenterCount} fulfillment hubs
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-surface/60 backdrop-blur-sm">
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
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-14">
        <h2 className="mb-5 text-sm font-semibold text-slate">Shop by category</h2>
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
          <h2 className="text-sm font-semibold text-slate">Popular materials</h2>
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
