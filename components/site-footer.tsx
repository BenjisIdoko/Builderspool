import Link from 'next/link';
import { getFulfillmentCenters } from '@/lib/queries/materials';
import { LogoMark } from './logo';

// 4-column footer per the Fable handoff. "Regional depots" uses the real
// fulfillment center regions (Abuja/Lagos/Kano) rather than the
// reference's fictional Ikeja/Idu/Port Harcourt. The reference's
// "Assurance" column ("Buyer protection", "Quality testing") is dropped —
// no such formal programs exist — replaced with real account navigation.
// "Procurement desk" uses the contact details from DESIGN.md (section 6).
export async function SiteFooter() {
  const centers = await getFulfillmentCenters();

  return (
    <footer className="mt-14 bg-ink text-white">
      <div className="mx-auto grid max-w-section grid-cols-2 gap-x-5 gap-y-7 px-6 py-10 sm:gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <LogoMark className="size-5" />
            <span className="font-display text-[15px] font-extrabold tracking-[-0.02em]">BUILDERS<span className="text-orange">POOL</span></span>
          </div>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-white/70">
            Escrow-protected construction materials trading, at a fixed catalogue price.
          </p>
        </div>
        <div>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[0.04em] text-white/60 uppercase">
            Regional depots
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            {centers.map((c) => (
              <span key={c.name} className="text-white/85">
                {c.name} — {c.region}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[0.04em] text-white/60 uppercase">
            Account
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <Link href="/login" className="text-white/85 hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="text-white/85 hover:text-white">
              Create an account
            </Link>
            <Link href="/catalog" className="text-white/85 hover:text-white">
              Browse the catalog
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[0.04em] text-white/60 uppercase">
            Procurement desk
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <a href="tel:+2348054207559" className="text-white/85 hover:text-white">
              +234 805 420 7559
            </a>
            <a href="mailto:info@builderspool.net" className="text-white/85 hover:text-white">
              info@builderspool.net
            </a>
            <span className="text-white/85">Ushafa Fulfilment Centre</span>
            <span className="text-white/60">Mon–Sat, 8am–6pm</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 px-6 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Builders&apos; Pool Technologies Ltd (CAC RC 9317391). Construction materials, sourced and delivered.
      </div>
    </footer>
  );
}
