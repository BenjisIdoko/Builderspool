import Link from 'next/link';
import { LogoTile } from './logo';

// Footer copy as on the Floot site: tagline, Buy / Sell / Contact columns,
// and the company line. Contact details match DESIGN.md (section 6).
const WHATSAPP_HREF = 'https://wa.me/2348054207559';

export function SiteFooter() {
  return (
    <footer className="mt-14 bg-ink text-white">
      <div className="mx-auto grid-12 max-w-section gap-y-8 py-12">
        <div className="col-span-12 lg:col-span-5">
          <div className="mb-2 flex items-center gap-2">
            <LogoTile className="size-8" />
            <span className="font-display text-[15px] font-extrabold tracking-[-0.03em]">
              BUILDERS<span className="text-orange">POOL</span>
            </span>
          </div>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-white/70">
            Collaborative procurement for construction materials, Abuja (FCT), Nigeria.
          </p>
        </div>
        <div className="col-span-6 md:col-span-4 lg:col-span-2">
          <div className="mb-2.5 text-label text-white/60 uppercase">Buy</div>
          <div className="flex flex-col items-start text-[13px]">
            <Link href="/catalog" className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              Browse materials
            </Link>
            <Link href="/#how" className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              Pool &amp; Save
            </Link>
            <Link href="/#how" className="text-white/60 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              How it works
            </Link>
          </div>
        </div>
        <div className="col-span-6 md:col-span-4 lg:col-span-2">
          <div className="mb-2.5 text-label text-white/60 uppercase">Sell</div>
          <div className="flex flex-col items-start text-[13px]">
            <Link href="/seller/signup" className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              Become a supplier
            </Link>
            <Link href="/seller/login" className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              Supplier log in
            </Link>
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="mb-2.5 text-label text-white/60 uppercase">
            Contact
          </div>
          <div className="flex flex-col items-start text-[13px]">
            <a href="tel:+2348054207559" className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              +234 805 420 7559
            </a>
            <a href={WHATSAPP_HREF} className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              WhatsApp us
            </a>
            <a href="mailto:info@builderspool.net" className="text-white/85 inline-flex min-h-11 items-center rounded-sm outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 lg:min-h-8">
              info@builderspool.net
            </a>
            <span className="mt-1.5 text-white/60">Monday to Saturday, 8am – 6pm</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 px-6 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Builders’ Pool Technologies Ltd · RC 9317391
      </div>
    </footer>
  );
}
