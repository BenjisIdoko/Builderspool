import Link from 'next/link';
import { getFulfillmentCenters } from '@/lib/queries/materials';
import { LogoMark } from './logo';

// 4-column footer per the Fable handoff. "Regional depots" uses the real
// fulfillment center regions (Abuja/Lagos/Kano) rather than the
// reference's fictional Ikeja/Idu/Port Harcourt, and the reference's
// "Procurement desk" phone-number column is dropped entirely — no real
// support phone/email exists yet, and this app doesn't fabricate contact
// details it can't back (same rule applied to every other unbacked
// specific throughout this project).
export async function SiteFooter() {
  const centers = await getFulfillmentCenters();

  return (
    <footer className="mt-14 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-3">
        <div>
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
      </div>
      <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Builders Pool. Construction materials, sourced and delivered.
      </div>
    </footer>
  );
}
