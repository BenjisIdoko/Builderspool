import { createElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TagIcon, LockKeyIcon, TruckIcon, ArrowRightIcon } from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories } from '@/lib/queries/materials';
import { getStorefrontStats } from '@/lib/queries/stats';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { MaterialCard } from '@/components/material-card';
import { Button } from '@/components/ui/button';

const TRUST_BADGES = [
  { icon: TagIcon, label: 'Fixed catalogue price', body: 'No back-and-forth negotiation' },
  { icon: LockKeyIcon, label: 'Escrow-protected checkout', body: 'Funds held until fulfillment center receipt' },
  { icon: TruckIcon, label: 'Tracked haulage', body: 'Real dispatch status, not a black box' },
];

const FLOW_STEPS = [
  { title: 'Order confirmed', body: 'Fixed price, paid immediately.' },
  { title: 'Demand pooled', body: 'Combined daily with other buyers.' },
  { title: 'Procurement negotiated', body: 'Sellers compete to supply the pool.' },
  { title: 'Materials prepared', body: 'Routed to the nearest fulfillment center.' },
  { title: 'Delivered', body: 'To your site, or ready for pickup.' },
];

export default async function Home() {
  const [{ materials }, stats, categories, buyer] = await Promise.all([
    getMaterials(),
    getStorefrontStats(),
    getCategories(),
    getCurrentBuyer(),
  ]);
  const featured = materials.slice(0, 8);

  const trustStats = [
    { value: stats.materialCount, label: 'Materials listed' },
    { value: stats.fulfillmentCenterCount, label: 'Fulfillment centers' },
    { value: stats.sellerCount, label: 'Registered sellers' },
    { value: stats.categoryCount, label: 'Categories' },
  ];

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
          <div className="mb-6 text-xs tracking-wide text-white/60">
            Construction materials · sourced nationally
          </div>
          <h1 className="max-w-3xl text-5xl leading-[1.05] font-extrabold tracking-[-0.02em] text-white sm:text-6xl lg:text-[68px]">
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

          <div className="relative mt-16 flex border-t border-white/15">
            {trustStats.map((ts) => (
              <div key={ts.label} className="flex-1 border-r border-white/15 px-4 pt-6 first:pl-0 last:border-r-0 sm:px-8">
                <div className="text-3xl font-semibold tabular-nums text-white sm:text-4xl">{ts.value}</div>
                <div className="mt-1.5 text-xs text-white/60 sm:text-sm">{ts.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-start gap-3 px-6 py-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
                <badge.icon className="size-4.5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{badge.label}</div>
                <div className="text-xs text-muted-foreground">{badge.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-ink">Browse by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/catalog?category=${encodeURIComponent(c.name)}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-well text-brand">
                {createElement(getCategoryIcon(c.name), { className: 'size-5' })}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.count} materials</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Dark philosophy band — full-bleed, distinct from the hero's photo,
          same restrained blueprint-grid texture in white at low opacity.
          Buyer-safe lifecycle copy throughout — no bidding/auction/scoring
          language, matching every other buyer-facing surface in this app. */}
      <section
        className="relative bg-ink px-6 py-24 text-white"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-xl">
            <div className="mb-5 text-xs text-white/50">Product philosophy</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple for the buyer. Sophisticated behind the scenes.
            </h2>
          </div>

          <div className="relative flex flex-col gap-10 sm:flex-row sm:items-start">
            <div className="absolute top-[6.5px] right-0 left-0 hidden h-px bg-white/25 sm:block" />
            {FLOW_STEPS.map((step, i) => (
              <div key={step.title} className="relative flex-1 sm:pr-5">
                <div
                  className={`relative z-10 mb-5 size-3.5 rounded-full border-2 border-ink ${
                    i === FLOW_STEPS.length - 1 ? 'bg-brand' : 'bg-canvas'
                  }`}
                />
                <div className="mb-1.5 text-sm font-semibold">{step.title}</div>
                <div className="text-[13px] leading-relaxed text-white/55">{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Popular materials</h2>
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

      {!buyer && (
        <section className="mx-auto w-full max-w-7xl px-6 pb-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-ink px-8 py-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Ready to order at a fixed price?</h2>
              <p className="mt-2 max-w-md text-sm text-white/70">
                Create a free account to check out, track orders, and set price alerts.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 shrink-0 gap-2 px-6 text-base">
              <Link href="/signup">
                Join Builders Pool
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
