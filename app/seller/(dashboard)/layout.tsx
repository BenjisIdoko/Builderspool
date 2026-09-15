import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPinIcon, SignOutIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { signOutSeller } from '@/app/seller/actions';
import { SellerSidebar } from '@/components/seller/seller-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { LogoMark } from '@/components/logo';
import { Button } from '@/components/ui/button';

const LINKS = [
  { href: '/seller', label: 'Open cycles' },
  { href: '/seller/bids', label: 'My bids' },
  { href: '/seller/allocations', label: 'Allocations' },
];

export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const profile = await getSellerProfile(sellerId);
  if (!profile) redirect('/seller/login');

  return (
    <div className="flex flex-1">
      <SellerSidebar profile={profile} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-5 backdrop-blur lg:hidden">
          <MobileNav
            links={LINKS}
            title="Seller portal"
            hideFrom="lg"
            footer={
              <>
                <div className="mb-1 text-sm font-semibold text-ink">
                  {profile.user.businessName ?? profile.user.name}
                </div>
                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3.5" />
                  {profile.regionsServed.join(', ')}
                </div>
                <form action={signOutSeller}>
                  <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 px-2">
                    <SignOutIcon className="size-4" />
                    Sign out
                  </Button>
                </form>
              </>
            }
          />
          <Link href="/seller" className="flex items-center gap-2">
            <LogoMark className="size-7" />
            <span className="text-sm font-medium tracking-tight text-ink">Seller portal</span>
          </Link>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
