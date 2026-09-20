import Image from 'next/image';
import Link from 'next/link';
import { CertificateIcon, LockKeyIcon, ArrowUpRightIcon, PhoneIcon, MapPinIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react/ssr';
import { getMaterials, getCategories, getFulfillmentCenters } from '@/lib/queries/materials';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { MaterialCard } from '@/components/material-card';
import { HeroLiveCard } from '@/components/hero-live-card';
import { PhilosophySteps } from '@/components/philosophy-steps';
import { FaqAccordion } from '@/components/faq-accordion';
import { Button } from '@/components/ui/button';

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
  const featured = materials.slice(0, 8);
  const categoryLoop = [...categories, ...categories];

  return (
    <div className="flex flex-1 flex-col">
      {/* Full-bleed hero, min-h-[100svh] — the fixed SiteHeader floats over
          it with a blurred pill, so this section deliberately gets no top
          padding (every other page reserves pt-28 for the header; this is
          the one exception, matching the Fable handoff). */}
      <section className="relative min-h-[100svh] w-full overflow-hidden bg-ink">
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

        <div className="relative z-[2] mx-auto flex min-h-[100svh] max-w-section flex-col justify-center px-5 pt-[110px] pb-12 min-[760px]:px-6 min-[760px]:py-12">
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
            <h1 className="text-[clamp(32px,5vw,4rem)] leading-[1.1] font-extrabold tracking-[-0.02em] text-white">
              Construction materials,
              <br />
              <span className="text-[#7c9cff]">delivered at a fair price.</span>
            </h1>
            <p className="mt-4.5 max-w-md text-sm leading-[1.55] text-white/82 min-[760px]:text-[16.5px] min-[760px]:leading-relaxed">
              Cement, blocks, rebar, roofing and fittings — one fixed price, no back-and-forth. Pick up
              at a fulfillment center or get it delivered to site.
            </p>
            <div className="mt-[22px] flex flex-wrap gap-3 min-[760px]:mt-7">
              <Button asChild className="h-[42px] rounded-full bg-brand px-5 text-[13.5px] font-bold min-[760px]:h-[46px] min-[760px]:px-6.5 min-[760px]:text-[14.5px] shadow-[0_10px_24px_rgba(41,84,229,0.4)]">
                <Link href="/catalog">Start Procuring</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-[42px] rounded-full border-white/40 bg-transparent px-5 text-[13.5px] font-bold min-[760px]:h-[46px] min-[760px]:px-6.5 min-[760px]:text-[14.5px] text-white hover:bg-white/10"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>

        <HeroLiveCard />
      </section>

      <section className="mx-auto w-full max-w-section px-6 pt-8">
        <div className="mb-5 text-center text-[11.5px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Trusted by suppliers and contractors nationwide
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3.5 min-[760px]:gap-6">
          {PARTNER_LOGOS.map((label) => (
            <div key={label} className="text-[12.5px] font-bold tracking-normal text-[#9aa0a8] uppercase min-[760px]:text-base min-[760px]:tracking-[0.01em]">
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Category marquee — infinite CSS scroll, real category names from
          the live catalog, doubled so the loop point is invisible. */}
      <section className="px-6 pt-16">
        <div className="mx-auto max-w-section overflow-hidden rounded-[32px] bg-brand py-6.5">
          <div className="[mask-image:linear-gradient(90deg,transparent,#fff_4%,#fff_96%,transparent)] overflow-hidden">
            <div
              className="flex w-max items-center"
              style={{ animation: 'bp-marquee 28s linear infinite' }}
            >
              {categoryLoop.map((cat, i) => (
                <div key={`${cat.name}-${i}`} className="flex shrink-0 items-center gap-10 pr-10 whitespace-nowrap">
                  <span className="size-3 shrink-0 rotate-45 rounded-[2px] bg-white/90" />
                  <span className="text-2xl font-semibold tracking-[-0.01em] text-white">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 pt-16">
        <div className="mx-auto max-w-section">
          <PhilosophySteps />
        </div>
      </section>

      <section className="mx-auto w-full max-w-section px-6 pt-16">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.025em] text-ink">Verified direct depot supply</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Fixed catalogue price, checked against real fulfillment center stock.
            </p>
          </div>
          <Link href="/catalog" className="text-[13px] font-bold text-ink hover:text-brand">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-section px-6 pt-16">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.025em] text-ink">Frequently asked questions</h2>
        <FaqAccordion />
      </section>

      {/* CTA banner — visual treatment (dark photo card, fading to solid
          ink) adopted from the reference; copy reuses this app's existing
          honest account-creation pitch instead of the reference's
          "guaranteed volume-discounted haulage, dedicated site marshal,
          deferred invoice terms with a verified contractor account" —
          none of that exists here. Always shown, matching the reference
          (not gated on login state — buyer is still used for the header's
          own account/avatar treatment). */}
      <section className="mx-auto w-full max-w-section px-6 pt-16">
        <div className="relative min-h-[280px] overflow-hidden rounded-3xl bg-ink">
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
              <Button asChild className="h-12 rounded-full bg-white px-6 text-ink hover:bg-white/90">
                <Link href={buyer ? '/catalog' : '/signup'}>{buyer ? 'Browse the catalog' : 'Join Builders Pool'}</Link>
              </Button>
              {!buyer && (
                <Button
                  asChild
                  variant="outline"
                  className="h-12 gap-2 rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10"
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

      {/* Get in touch — real, active contact details confirmed by the
          user (not the reference's placeholder phone/email). Depot
          addresses use real fulfillment center data instead of the
          reference's fictional cities. */}
      <section className="mx-auto w-full max-w-section px-6 pt-16 pb-16">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.025em] text-ink">Get in touch</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="tel:+2348133941775"
            className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-5.5 text-ink no-underline transition-colors hover:border-border-strong"
          >
            <PhoneIcon className="size-5.5 text-brand" />
            <div className="text-sm font-bold">Procurement desk</div>
            <div className="text-[13px] text-slate">+234 813 394 1775</div>
          </a>
          <a
            href="mailto:info@builderspool.com.ng"
            className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-5.5 text-ink no-underline transition-colors hover:border-border-strong"
          >
            <EnvelopeSimpleIcon className="size-5.5 text-brand" />
            <div className="text-sm font-bold">Email us</div>
            <div className="text-[13px] text-slate">info@builderspool.com.ng</div>
          </a>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-5.5">
            <MapPinIcon className="size-5.5 text-brand" />
            <div className="text-sm font-bold text-ink">Visit a depot</div>
            <div className="text-[13px] text-slate">
              {centers.map((c) => c.region).join(' · ')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
