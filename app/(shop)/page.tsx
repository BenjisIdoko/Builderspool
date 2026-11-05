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
import { getCategoryIcon } from '@/lib/categoryIcons';

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
        <div className="mx-auto flex min-h-[560px] w-full max-w-section flex-col justify-between px-4 pt-12 sm:px-0 lg:min-h-[620px] lg:pt-20">
          <div>
            <p className="text-label uppercase text-cyan">Pool &amp; Save · Abuja</p>
            <h1 className="mt-4 max-w-[12ch] text-display-xl text-white">
              Build smarter. <span className="text-cyan">Save more.</span>
            </h1>
            <p className="mt-5 max-w-[34ch] text-body-lg text-white/85">
              Join today’s pool with other builders. Verified suppliers compete for the combined order.
            </p>
            <p className="mt-4 text-body-sm text-white/85">
              <span className="font-mono font-medium text-cyan">50%</span> of the verified saving comes back to you.{' '}
              <Link href="#how" className="text-white underline underline-offset-2">
                How it’s calculated
              </Link>
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
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

      <Reveal>
        <section id="how" className="mx-auto w-full max-w-section scroll-mt-40 px-3 pt-3 sm:px-0">
          <PoolSaveSteps />
        </section>
      </Reveal>

      <div className="mx-auto flex w-full max-w-section flex-col gap-3 px-3 pt-3 sm:px-0">
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

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="#delivery"
            className="flex flex-col justify-center gap-1 rounded-md bg-ink p-6 text-white transition-shadow hover:shadow-card-hover"
          >
            <span className="text-[11.5px] font-bold tracking-[0.06em] text-white/60 uppercase">
              Ushafa Fulfilment Centre
            </span>
            <span className="font-display text-2xl leading-tight font-extrabold">
              Collect free.
              <br />
              ₦0 delivery.
            </span>
            <span className="mt-1 text-[13px] text-white/75">Mon–Sat, 8am–6pm · Bwari Area Council</span>
          </Link>
          <Link
            href="/seller/signup"
            className="flex flex-col justify-center gap-1 rounded-md bg-pale-blue p-6 text-ink transition-shadow hover:shadow-card-hover"
          >
            <span className="text-[11.5px] font-bold tracking-[0.06em] text-cyan-text uppercase">For suppliers</span>
            <span className="font-display text-2xl leading-tight font-extrabold">
              Sell to Abuja’s
              <br />
              builders.
            </span>
            <span className="mt-2 inline-flex min-h-11 w-fit items-center rounded-md bg-cta px-5 text-sm font-medium text-white">
              Become a supplier
            </span>
          </Link>
        </div>

        <section className="rounded-md bg-surface">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-heading-md text-text-storefront">Shop by category</h2>
          </div>
          <ul className="grid grid-cols-2 gap-2 p-2 min-[600px]:grid-cols-3 min-[900px]:grid-cols-6">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              return (
                <li key={cat.name}>
                  <Link
                    href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                    className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-md px-2 py-4 text-center transition-colors hover:bg-canvas"
                  >
                    <span className="flex size-14 items-center justify-center rounded-full bg-canvas text-ink">
                      <Icon className="size-7" strokeWidth={1.5} />
                    </span>
                    <span className="text-sm leading-snug font-medium text-text-storefront">{cat.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Reveal>
        <section id="safe" className="mx-auto w-full max-w-section scroll-mt-40 px-3 pt-3 sm:px-0">
          <ul className="grid grid-cols-1 gap-x-3 gap-y-1 rounded-md bg-surface px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="flex min-h-11 items-start gap-2.5 py-1.5">
                <Icon weight="fill" className="mt-0.5 size-5 shrink-0 text-cyan-strong" />
                <span>
                  <span className="block text-sm font-bold text-text-storefront">{title}</span>
                  <span className="block text-[13px] text-slate">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section id="delivery" className="mx-auto w-full max-w-section scroll-mt-40 px-3 pt-3 pb-4 sm:px-0">
          <p className="rounded-md bg-surface px-4 py-3 text-[13.5px] leading-relaxed text-slate">
            Delivery: one flat fee per seller, shown before you pay, across {DELIVERY_ZONES.join(', ')}. Or collect free
            at the Ushafa Fulfilment Centre, Monday to Saturday, 8am – 6pm.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
