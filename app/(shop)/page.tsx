import { createElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TagIcon, LockKeyIcon, TruckIcon, ArrowRightIcon, ShieldCheckIcon } from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories } from '@/lib/queries/materials';
import { getStorefrontStats } from '@/lib/queries/stats';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { MaterialCard } from '@/components/material-card';
import { Button } from '@/components/ui/button';

// A rare, deliberate exception to the sitewide hairline-border/no-shadow
// rule (see DESIGN.md) — the same subtle shadow the Fable handoff uses on
// buyer-marketing surfaces only (hero card, trust badges, category tiles),
// never on routine controls or admin/seller tables.
const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(16,24,40,0.04)]';

const TRUST_BADGES = [
  { icon: LockKeyIcon, label: 'Escrow protected', body: 'Funds released only on fulfillment center receipt' },
  { icon: TagIcon, label: 'Fixed catalogue price', body: 'No back-and-forth negotiation' },
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
      <section className="mx-auto w-full max-w-7xl px-6 pt-10 sm:pt-14">
        {/* Signature duotone hero, now an inset rounded card rather than
            full-bleed — matches the Fable handoff's composition. The
            gradient + photo + decorative circles are the one deliberately
            bold color moment on the site, reserved for the hero only. */}
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl p-10 shadow-[0_32px_64px_-12px_rgba(41,84,229,0.35),0_8px_24px_rgba(15,23,42,0.12)] sm:p-14">
          <div className="absolute inset-0">
            <Image
              src="/materials/cement.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-35 mix-blend-multiply"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-deep to-brand-warm" />
          </div>
          <div className="absolute -top-16 right-28 size-56 rounded-full bg-white/10" />
          <div className="absolute -right-10 -bottom-20 size-64 rounded-full bg-brand-warm/25" />

          <div className="relative max-w-xl">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
              <ShieldCheckIcon weight="fill" className="size-3.5" />
              Escrow-protected · fixed catalogue price
            </div>
            <h1 className="text-[32px] leading-[1.12] font-extrabold tracking-[-0.02em] text-white sm:text-[42px]">
              Construction materials, delivered at a fair price.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/90">
              Cement, blocks, rebar, roofing and fittings — one fixed price, no back-and-forth. Pick up
              at a fulfillment center or get it delivered to site.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 bg-white px-6 text-base text-ink hover:bg-white/90">
                <Link href="/catalog">Browse the catalog</Link>
              </Button>
              {!buyer && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 border-white/50 bg-transparent px-6 text-base text-white hover:bg-white/10"
                >
                  <Link href="/signup">Join Builders Pool</Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className={`flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4.5 py-3.5 ${CARD_SHADOW}`}
            >
              <badge.icon className="size-[18px] shrink-0 text-brand" />
              <div>
                <div className="text-[13px] font-bold text-ink">{badge.label}</div>
                <div className="text-[11.5px] text-muted-foreground">{badge.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex border-t border-border">
          {trustStats.map((ts) => (
            <div key={ts.label} className="flex-1 border-r border-border px-4 pt-6 first:pl-0 last:border-r-0 sm:px-8">
              <div className="text-2xl font-semibold tabular-nums text-ink sm:text-3xl">{ts.value}</div>
              <div className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{ts.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-ink">Primary building categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/catalog?category=${encodeURIComponent(c.name)}`}
              className={`flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong ${CARD_SHADOW}`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-well text-brand">
                {createElement(getCategoryIcon(c.name), { className: 'size-4.5' })}
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
