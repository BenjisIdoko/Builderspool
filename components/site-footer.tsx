import Link from 'next/link';
import { getFulfillmentCenters } from '@/lib/queries/materials';
import { LogoMark } from './logo';

// 4-column footer per the Fable handoff. "Regional depots" uses the real
// fulfillment center regions (Abuja/Lagos/Kano) rather than the
// reference's fictional Ikeja/Idu/Port Harcourt. The reference's
// "Assurance" column ("Buyer protection", "Quality testing") is dropped —
// no such formal programs exist — replaced with real account navigation.
// "Procurement desk" uses the same real, user-confirmed phone number the
// page's own "Get in touch" section already shows.
export async function SiteFooter() {
  const centers = await getFulfillmentCenters();

  return (
    <footer className="mt-14 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-section grid-cols-2 gap-x-5 gap-y-7 px-6 py-10 sm:gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <LogoMark className="size-5" />
            <span className="text-[15px] font-extrabold text-ink">Builders Pool</span>
          </div>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
            Escrow-protected construction materials trading, at a fixed catalogue price.
          </p>
        </div>
        <div>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
            Regional depots
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            {centers.map((c) => (
              <span key={c.name} className="text-slate">
                {c.name} — {c.region}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
            Account
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <Link href="/login" className="text-slate hover:text-ink">
              Log in
            </Link>
            <Link href="/signup" className="text-slate hover:text-ink">
              Create an account
            </Link>
            <Link href="/catalog" className="text-slate hover:text-ink">
              Browse the catalog
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[11.5px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
            Procurement desk
          </div>
          <a href="tel:+2348133941775" className="text-[13px] text-slate hover:text-ink">
            +234 813 394 1775
          </a>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Builders Pool. Construction materials, sourced and delivered.
      </div>
    </footer>
  );
}
