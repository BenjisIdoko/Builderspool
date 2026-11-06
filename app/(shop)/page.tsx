import { Reveal } from '@/components/motion/reveal';
import Image from 'next/image';
import Link from 'next/link';
import {
  CertificateIcon,
  KeyIcon,
  LockKeyIcon,
  ScalesIcon,
} from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories } from '@/lib/queries/materials';
import { HeroPoolBar } from '@/components/hero-pool-bar';
import { PoolSaveSteps } from '@/components/pool-save-steps';
import { Button } from '@/components/ui/button';
import { ProductRail } from '@/components/product-rail';

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
  { icon: LockKeyIcon, title: 'Secure payment', sub: 'Sellers paid after delivery' },
  { icon: KeyIcon, title: 'Delivery code', sub: 'Share it only when goods arrive' },
  { icon: ScalesIcon, title: 'Fair disputes', sub: 'Report within 3 days' },
];

export default async function Home() {
  const [{ materials }, categories] = await Promise.all([getMaterials(), getCategories()]);
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
        <div className="mx-auto flex min-h-[560px] w-full max-w-section flex-col justify-between pt-12 lg:min-h-[620px] lg:pt-20">
          <div>
            <p className="bp-rise text-label uppercase text-cyan">Pool &amp; Save · Abuja</p>
            <h1 className="bp-rise mt-4 max-w-[12ch] text-display-xl text-white">
              Build smarter. <span className="text-cyan">Save more.</span>
            </h1>
            <p className="bp-rise mt-5 max-w-[34ch] text-body-lg text-white/85" style={{ '--rise-delay': '60ms' } as React.CSSProperties}>
              Join today’s pool with other builders. Verified suppliers compete for the combined order.
            </p>
            <p className="bp-rise mt-4 text-body-sm text-white/85" style={{ '--rise-delay': '60ms' } as React.CSSProperties}>
              <span className="font-mono font-medium text-cyan">50%</span> of the verified saving comes back to you.{' '}
              <Link href="#how" className="text-white underline underline-offset-2">
                How it’s calculated
              </Link>
            </p>
            <div className="bp-rise mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ '--rise-delay': '120ms' } as React.CSSProperties}>
              <Button asChild variant="cta" size="lg" className="h-12 px-7 text-base">
                <Link href="#join">Join today’s pool</Link>
              </Button>
              <Link href="/catalog" className="text-body font-bold underline-offset-4 hover:underline">
                Shop materials →
              </Link>
            </div>
          </div>
          <HeroPoolBar />
        </div>
      </section>

      <section id="how" className="scroll-mt-40 bg-pale-blue">
        <PoolSaveSteps />
      </section>

      <div className="mx-auto flex w-full max-w-section flex-col gap-3 pt-section">
        <div id="join" className="scroll-mt-40">
          <ProductRail
            title="Join today’s pool"
            subtitle="Pick a product, quantity and site. Change or withdraw until 12:00."
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
          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid-12 gap-y-3">
            <Link
              href="#delivery"
              className="col-span-12 flex flex-col overflow-hidden rounded-panel bg-ink text-white lg:col-span-7 lg:min-h-[360px]"
            >
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
            </Link>
            <Link
              href="/seller/signup"
              className="col-span-12 flex min-h-[260px] flex-col justify-end rounded-panel bg-pale-blue p-6 text-ink lg:col-span-5 lg:min-h-[360px] lg:p-8"
            >
              <span className="text-label uppercase text-cyan-text">For suppliers</span>
              <span className="mt-2 text-display-lg">
                Sell to Abuja’s
                <br />
                builders.
              </span>
              <span className="mt-5 inline-flex h-12 w-fit items-center rounded-md bg-cta px-7 text-base font-bold text-white">
                Become a supplier
              </span>
            </Link>
          </div>
          <p className="mt-4 max-w-[72ch] text-caption text-slate">
            Delivery: one flat fee per seller, shown before you pay, across {DELIVERY_ZONES.join(', ')}. Or collect free
            at the Ushafa Fulfilment Centre, Monday to Saturday, 8am – 6pm.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-section pt-section pb-section-tight">
          <h2 className="text-heading-lg text-ink">Shop by category</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => {
              const photo = categoryPhoto.get(cat.name) ?? null;
              return (
                <li key={cat.name}>
                  <Link
                    href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                    className={`group relative block aspect-[4/3] overflow-hidden rounded-card ${photo ? 'bg-surface' : 'bg-navy-raised'}`}
                  >
                    {photo && (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
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
