import Image from 'next/image';
import Link from 'next/link';
import { LogoMark } from '@/components/logo';

// Shared shell for every auth page (buyer /login, /signup; seller
// /seller/login, /seller/signup) — the split-screen layout from the
// reference screenshot, restyled onto this app's own brand tokens and
// real photography rather than a stock illustration of people (this app
// has never used stock/placeholder photos of people — see Avatar's
// initials-only rule in DESIGN.md — an auth screen isn't an exception).
export function AuthSplitScreen({
  eyebrow,
  headline,
  body,
  children,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <Image
          src="/materials/cement.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover grayscale contrast-125"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-deep to-brand-warm mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/65 to-ink/30" />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <div className="mb-6 text-xs tracking-wide text-white/60">{eyebrow}</div>
          <h1 className="max-w-md text-4xl leading-[1.1] font-extrabold tracking-[-0.02em] text-white">
            {headline}
          </h1>
          <p className="mt-5 max-w-sm text-white/80">{body}</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-12 lg:w-1/2 lg:px-20">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <LogoMark className="size-8" />
          <span className="text-[15px] font-medium tracking-tight text-ink">Builders Pool</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
