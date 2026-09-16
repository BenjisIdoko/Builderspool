import Link from 'next/link';
import { signOutAdmin } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/logo';
import { MobileNav } from '@/components/mobile-nav';

const LINKS = [
  { href: '/admin', label: 'Bid cycles' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/catalogue-reference', label: 'Catalogue reference' },
];

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <MobileNav links={LINKS} title="Ops admin" hideFrom="sm" />

          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="text-[15px] font-bold tracking-tight text-ink">Ops admin</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate sm:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <form action={signOutAdmin}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
