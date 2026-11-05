import { Reveal } from '@/components/motion/reveal';
import Image from 'next/image';
import Link from 'next/link';
import {
  CertificateIcon,
  LockKeyIcon,
  ArrowUpRightIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeSimpleIcon,
  StorefrontIcon,
  TagIcon,
  TruckIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories, getFulfillmentCenters } from '@/lib/queries/materials';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { HeroLiveCard } from '@/components/hero-live-card';
import { PhilosophySteps } from '@/components/philosophy-steps';
import { FaqAccordion } from '@/components/faq-accordion';
import { Button } from '@/components/ui/button';
import { ProductRail } from '@/components/product-rail';
import { getCategoryIcon } from '@/lib/categoryIcons';

// Real, existing Nigerian building-material manufacturers — the Fable
// reference's own list, kept verbatim per explicit direction to adopt the
// handoff exactly. Only Dangote and BUA currently have real products in
// this app's seeded catalog; the rest are named here as real companies
// buyers recognize, same as any "materials you can find here" marketing
// strip, not as a claim of an exclusive partnership or verified account.
const PARTNER_LOGOS = [
  'Dangote Cement',
  'BUA Cement',
  'Nigerite',
  'Unicem',
  'First Aluminium',
  'Meyer',
  'Dulux',
  'Whitchtech',
  'Louis Valentino',
];

export default async function Home() {
  const [{ materials }, categories, buyer, centers] = await Promise.all([
    getMaterials(),
    getCategories(),
    getCurrentBuyer(),
    getFulfillmentCenters(),
  ]);
  const featured = materials.slice(0, 10);
  // The three biggest categories each get their own rail.
  const railCategories = [...categories].sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-section px-3 pt-3 sm:px-0 sm:pt-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="relative min-h-[340px] overflow-hidden rounded-md bg-ink lg:min-h-[400px]">
          <Image
            src="/hero.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: 'center 25%' }}
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(21,24,28,0.92)_0%,rgba(21,24,28,0.68)_35%,rgba(21,24,28,0.3)_58%,rgba(21,24,28,0.05)_78%,rgba(21,24,28,0)_100%)] max-[759px]:bg-[linear-gradient(180deg,rgba(21,24,28,0.75)_0%,rgba(21,24,28,0.6)_45%,rgba(21,24,28,0.35)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,24,28,0)_50%,rgba(21,24,28,0.4)_100%)] max-[759px]:bg-[linear-gradient(180deg,rgba(21,24,28,0.15)_0%,rgba(21,24,28,0.65)_65%,rgba(21,24,28,0.85)_100%)]" />

          <div className="relative z-[2] flex min-h-[340px] flex-col justify-center px-5 py-8 min-[760px]:px-8 lg:min-h-[400px]">
            <div className="max-w-2xl">
              <div className="mb-5 flex flex-wrap items-center gap-2.5 text-[13px] text-white/85">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CertificateIcon weight="fill" className="size-4" />
                  SON &amp; NIS certified
                </span>
                <span className="h-3.5 w-px bg-white/30" />
                <span className="flex items-center gap-1.5 font-semibold">
                  <LockKeyIcon weight="fill" className="size-4" />
                  Secure payments
                </span>
              </div>
              <h1 className="text-[clamp(26px,4.5vw,44px)] leading-[1.15] font-bold tracking-[-0.02em] text-white">
                Construction materials,
                <br />
                <span className="text-orange">delivered at a fair price.</span>
              </h1>
              <p className="mt-4.5 max-w-md text-sm leading-[1.55] text-white/82 min-[760px]:text-[16.5px] min-[760px]:leading-relaxed">
                Cement, blocks, rebar, roofing and fittings — one fixed price, no back-and-forth. Pick up
                at a fulfillment center or get it delivered to site.
              </p>
              <div className="mt-[22px] flex flex-wrap gap-3 min-[760px]:mt-7">
                <Button asChild variant="cta" size="lg" className="px-6">
                  <Link href="/catalog">Start Procuring</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
            </div>
          </div>

          <HeroLiveCard />
        </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <a
              href="#how-it-works"
              className="flex flex-col justify-center gap-1.5 rounded-md bg-pale-blue p-4 transition-shadow hover:shadow-card-hover"
            >
              <UsersThreeIcon className="size-7 text-cyan-text" />
              <div className="text-sm font-bold text-ink">How Pool &amp; Save works</div>
              <div className="text-[13px] text-slate">Orders are pooled daily and sellers compete to supply them.</div>
            </a>
            <Link
              href="/seller/signup"
              className="flex flex-col justify-center gap-1.5 rounded-md bg-surface p-4 transition-shadow hover:shadow-card-hover"
            >
              <StorefrontIcon className="size-7 text-orange-text" />
              <div className="text-sm font-bold text-ink">Sell on BuildersPool</div>
              <div className="text-[13px] text-slate">Register your business and supply the daily pool.</div>
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Why buy here" className="mx-auto w-full max-w-section px-3 pt-3 sm:px-0">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-surface px-4 py-2 lg:grid-cols-4">
          {[
            { icon: TagIcon, label: 'Fixed catalogue price' },
            { icon: LockKeyIcon, label: 'Secure payments' },
            { icon: TruckIcon, label: 'Delivery or depot pickup' },
            { icon: CertificateIcon, label: 'SON & NIS certified' },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-text-storefront">
              <Icon weight="fill" className="size-5 shrink-0 text-cyan-strong" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto flex w-full max-w-section flex-col gap-3 px-3 pt-3 sm:px-0">
        <section className="rounded-md bg-surface">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-lg text-text-storefront">Shop by category</h2>
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
                    <span className="text-xs text-muted-foreground">
                      {cat.count} {cat.count === 1 ? 'product' : 'products'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <ProductRail title="Top picks" href="/catalog" materials={featured} />

        {railCategories.map((cat) => (
          <ProductRail
            key={cat.name}
            title={cat.name}
            href={`/catalog?category=${encodeURIComponent(cat.name)}`}
            materials={materials.filter((m) => m.category === cat.name).slice(0, 10)}
          />
        ))}

        <section className="rounded-md bg-surface px-4 pt-5 pb-6">
          <div className="mb-4 text-center text-[11.5px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Trusted by suppliers and contractors nationwide
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {PARTNER_LOGOS.map((label) => (
              <div key={label} className="text-[12.5px] font-bold text-muted-foreground uppercase min-[760px]:text-sm">
                {label}
              </div>
            ))}
          </div>
        </section>
      </div>

      <Reveal>
      <section id="how-it-works" className="px-3 pt-3 sm:px-0">
        <div className="mx-auto max-w-section">
          <PhilosophySteps />
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section className="mx-auto w-full max-w-section px-6 pt-16">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.025em] text-ink">Frequently asked questions</h2>
        <FaqAccordion />
      </section>
      </Reveal>

      {/* CTA banner — visual treatment (dark photo card, fading to solid
          ink) adopted from the reference; copy reuses this app's existing
          honest account-creation pitch instead of the reference's
          "guaranteed volume-discounted haulage, dedicated site marshal,
          deferred invoice terms with a verified contractor account" —
          none of that exists here. Always shown, matching the reference
          (not gated on login state — buyer is still used for the header's
          own account/avatar treatment). */}
      <Reveal>
      <section className="mx-auto w-full max-w-section px-6 pt-16">
        <div className="relative min-h-[280px] overflow-hidden rounded-xl bg-ink">
          <Image
            src="/materials/rebar.jpg"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1152px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#15181c_0%,#15181c_30%,rgba(21,24,28,0.8)_45%,rgba(21,24,28,0.2)_62%,rgba(21,24,28,0)_76%)]" />
          <div className="relative z-[2] flex min-h-[280px] max-w-md flex-col justify-center gap-3.5 p-9 sm:p-11">
            <div className="text-xs font-bold tracking-[0.04em] text-white/50 uppercase">Get started</div>
            <h2 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.02em] text-white sm:text-[32px]">
              Ready to order at a fixed price?
            </h2>
            <p className="text-[14.5px] leading-relaxed text-white/75">
              {buyer
                ? 'Browse the catalog and check out at a fixed price, every time.'
                : 'Create a free account to check out, track orders, and set price alerts.'}
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <Button asChild variant="cta" size="lg" className="px-6">
                <Link href={buyer ? '/catalog' : '/signup'}>{buyer ? 'Browse the catalog' : 'Join Builders Pool'}</Link>
              </Button>
              {!buyer && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="gap-2 border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/catalog">
                    Browse the catalog
                    <ArrowUpRightIcon className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* Get in touch — real, active contact details confirmed by the
          user (not the reference's placeholder phone/email). Depot
          addresses use real fulfillment center data instead of the
          reference's fictional cities. */}
      <Reveal>
      <section className="mx-auto w-full max-w-section px-6 pt-16 pb-16">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.025em] text-ink">Get in touch</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="tel:+2348133941775"
            className="flex flex-col gap-2.5 rounded-lg bg-surface p-5.5 text-ink no-underline transition-shadow hover:shadow-card-hover"
          >
            <PhoneIcon className="size-5.5 text-cyan-strong" />
            <div className="text-sm font-bold">Procurement desk</div>
            <div className="text-[13px] text-slate">+234 813 394 1775</div>
          </a>
          <a
            href="mailto:info@builderspool.com.ng"
            className="flex flex-col gap-2.5 rounded-lg bg-surface p-5.5 text-ink no-underline transition-shadow hover:shadow-card-hover"
          >
            <EnvelopeSimpleIcon className="size-5.5 text-cyan-strong" />
            <div className="text-sm font-bold">Email us</div>
            <div className="text-[13px] text-slate">info@builderspool.com.ng</div>
          </a>
          <div className="flex flex-col gap-2.5 rounded-lg bg-surface p-5.5">
            <MapPinIcon className="size-5.5 text-cyan-strong" />
            <div className="text-sm font-bold text-ink">Visit a depot</div>
            <div className="text-[13px] text-slate">
              {centers.map((c) => c.region).join(' · ')}
            </div>
          </div>
        </div>
      </section>
      </Reveal>
    </div>
  );
}
