import { Reveal } from '@/components/motion/reveal';
import Image from 'next/image';
import Link from 'next/link';
import {
  CertificateIcon,
  LockKeyIcon,
  PackageIcon,
  TruckIcon,
} from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories } from '@/lib/queries/materials';
import { HeroPoolBar } from '@/components/hero-pool-bar';
import { getBuyerFacingTimes } from '@/lib/bidding/buyerTimes';
import { buildPoolStages, isPoolClosedForToday } from '@/lib/pool-stages';
import { PoolSaveSteps } from '@/components/pool-save-steps';
import { Button } from '@/components/ui/button';
import { ProductRail } from '@/components/product-rail';
import { formatClock } from '@/lib/format';

// Home page copy is taken from the Floot site (builderspool.floot.app).
const DELIVERY_ZONES = [
  'AMAC – Lugbe / Airport Road corridor',
  'AMAC – Nyanya / Karu / Jikwoyi corridor',
  'AMAC – Lokogoma / Wumba / Kabusa corridor',
  'Bwari Area Council',
  'Gwagwalada Area Council',
];


const TRUST = [
  { icon: CertificateIcon, title: 'Verified suppliers', sub: 'CAC, ID and address checked' },
  { icon: LockKeyIcon, title: 'Secure payment', sub: 'Suppliers paid after we receive your goods' },
  { icon: PackageIcon, title: 'Received at our centre', sub: 'Every order reaches us before it reaches you' },
  { icon: TruckIcon, title: 'Pickup or delivery', sub: 'Collect free, or delivered to site' },
];

export default async function Home() {
  const [{ materials }, categories, { times, sheets }] = await Promise.all([getMaterials(), getCategories(), getBuyerFacingTimes()]);
  const stages = buildPoolStages(times, sheets);
  const closed = isPoolClosedForToday(times);
  const poolDay = closed ? 'tomorrow’s' : 'today’s';
  // Home-page rails only feature products that have a real photo.
  const withPhoto = materials.filter((m) => m.imageUrl);
  const poolPicks = withPhoto.slice(0, 12);
  // One real product photo per category for the category tiles.
  const categoryPhoto = new Map<string, string>();
  for (const m of withPhoto) if (m.imageUrl && !categoryPhoto.has(m.category)) categoryPhoto.set(m.category, m.imageUrl);
  const pickedIds = new Set(poolPicks.map((m) => m.id));
  const lowestPrices = withPhoto
    .filter((m) => !pickedIds.has(m.id))
    .sort((a, b) => a.catalogPrice - b.catalogPrice)
    .slice(0, 12);

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative">
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Image
          src="/hero/warehouse.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[50%_40%]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(11,31,58,0.94)_0%,rgba(11,31,58,0.78)_40%,rgba(11,31,58,0.15)_75%,rgba(11,31,58,0)_100%)] max-md:bg-[linear-gradient(180deg,rgba(11,31,58,0.9)_0%,rgba(11,31,58,0.72)_100%)]" />
        {/* The hero is 85svh tall (DESIGN.md 5.4), never below 34rem nor above 60rem. The copy is
            centred in it; the bottom padding clears the half of the pool band that hangs over its
            lower edge. To change the height, change the 85. */}
        <div className="mx-auto flex min-h-[clamp(34rem,85svh,60rem)] w-full max-w-section flex-col justify-center pt-14 pb-28 lg:pt-16 lg:pb-28">
          <div>
            <p className="bp-rise text-label uppercase text-cyan">Pool &amp; Save · Abuja</p>
            <h1 className="bp-rise mt-4 max-w-[12ch] text-balance text-display-xl text-white">
              Build smarter. <span className="text-cyan">Save more.</span>
            </h1>
            <p className="bp-rise mt-5 max-w-[34ch] text-pretty text-body-lg text-white/85" style={{ '--rise-delay': '60ms' } as React.CSSProperties}>
              Join the pool with other builders. Verified suppliers compete for the combined order.
            </p>
            <p className="bp-rise mt-4 text-body-sm text-white/85" style={{ '--rise-delay': '60ms' } as React.CSSProperties}>
              <span className="font-mono font-medium text-cyan">50%</span> of the verified saving comes back to you.{' '}
              <Link href="#how" className="rounded-sm text-white underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                How it’s calculated
              </Link>
            </p>
            <div className="bp-rise mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ '--rise-delay': '120ms' } as React.CSSProperties}>
              <Button asChild variant="cta" size="lg" className="h-12 px-7 text-base">
                <Link href="#join">Join {poolDay} pool</Link>
              </Button>
              <Link href="/catalog" className="inline-flex min-h-11 items-center rounded-sm text-body font-bold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white/70">
                Shop materials →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The live pool band straddles the hero's bottom edge (DESIGN.md 5.4): anchored to it and
          shifted down by half its own height, so it works at any height. */}
      <div className="absolute inset-x-0 bottom-0 z-10 translate-y-1/2">
        <div className="mx-auto w-full max-w-section">
          <HeroPoolBar stages={stages} />
        </div>
      </div>
      </div>

      {/* The top padding clears the half of the band that hangs below the hero. */}
      <section id="how" className="scroll-mt-40 bg-pale-blue pt-[4.5rem] lg:pt-12">
        <PoolSaveSteps times={times} />
      </section>

      <div className="mx-auto flex w-full max-w-section flex-col gap-[var(--section-tight)] pt-section">
        <div id="join" className="scroll-mt-40">
          <ProductRail
            title={`Join ${poolDay} pool`}
            subtitle={
              closed
                ? `Today’s pool has closed. Orders placed now join tomorrow’s pool, which closes at ${formatClock(times.poolCloseTime)}.`
                : `Order before ${formatClock(times.poolCloseTime)} to join today’s pool.`
            }
            href="/catalog"
            materials={poolPicks}
          />
        </div>

        <ProductRail
          title="Lowest prices"
          subtitle="Lowest catalogue prices first"
          href="/catalog"
          materials={lowestPrices}
        />
      </div>

      <Reveal>
        <section id="safe" className="mx-auto w-full max-w-section scroll-mt-40 pt-section">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon weight="fill" className="mt-0.5 size-5 shrink-0 text-cyan-strong" />
                <span>
                  <span className="block text-body-sm font-bold text-ink">{title}</span>
                  <span className="block text-caption text-slate">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section id="delivery" className="mx-auto w-full max-w-section scroll-mt-40 pt-section">
          <div className="grid-12 gap-y-4">
            <div className="col-span-12 flex flex-col overflow-hidden rounded-panel bg-ink text-white lg:col-span-7 lg:min-h-[360px]">
              <span className="relative block h-[200px] shrink-0 sm:h-[240px] lg:h-[250px]">
                <Image
                  src="/hero/ushafa.webp"
                  alt="Ushafa Fulfilment Centre"
                  fill
                  sizes="(min-width: 1024px) 740px, 100vw"
                  className="object-cover object-[50%_30%]"
                />
              </span>
              <span className="flex flex-1 flex-col justify-end p-6 lg:p-8">
                <span className="text-label uppercase text-cyan">Ushafa Fulfilment Centre</span>
                <span className="mt-2 text-heading-xl">Collect free. ₦0 delivery.</span>
                <span className="mt-2 text-body-sm text-on-navy-muted">Mon–Sat, 8am–6pm · Bwari Area Council</span>
              </span>
            </div>
            <Link
              href="/seller/signup"
              className="group col-span-12 flex min-h-[260px] flex-col justify-end rounded-panel bg-pale-blue p-6 text-ink outline-none transition-colors duration-150 hover:bg-pale-blue/70 focus-visible:ring-2 focus-visible:ring-ring lg:col-span-5 lg:min-h-[360px] lg:p-8"
            >
              <span className="text-label uppercase text-cyan-text">For suppliers</span>
              <span className="mt-2 text-display-lg">
                Sell to Abuja’s
                <br />
                builders.
              </span>
              <span className="mt-5 inline-flex h-12 w-fit items-center rounded-md bg-cta px-7 text-base font-bold text-white transition-colors duration-150 group-hover:bg-cta-hover">
                Become a supplier
              </span>
            </Link>
          </div>
          <p className="mt-6 max-w-[72ch] text-pretty text-caption text-slate">
            Delivery is a flat fee for your area, shown before you pay, across {DELIVERY_ZONES.join(', ')}. Or collect free
            at the Ushafa Fulfilment Centre, Monday to Saturday, 8am – 6pm.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-section pt-section pb-section">
          <h2 className="text-heading-lg text-ink">Shop by category</h2>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => {
              const photo = categoryPhoto.get(cat.name) ?? null;
              return (
                <li key={cat.name}>
                  <Link
                    href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                    className={`group relative block aspect-[4/3] overflow-hidden rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring ${photo ? 'bg-surface' : 'bg-navy-raised'}`}
                  >
                    {photo && (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105"
                      />
                    )}
                    {photo && (
                      <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,31,58,0.85)_0%,rgba(11,31,58,0)_65%)]" />
                    )}
                    <span className="absolute inset-x-3 bottom-3 text-body-sm font-bold text-white">{cat.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
