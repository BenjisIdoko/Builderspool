import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPinIcon, SignOutIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { signOutSeller } from '@/app/seller/actions';
import { getNotificationsForSeller } from '@/lib/notifications';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { SellerSidebar } from '@/components/seller/seller-sidebar';
import { NotificationBell } from '@/components/seller/notification-bell';
import { MobileNav } from '@/components/mobile-nav';
import { LogoMark } from '@/components/logo';
import { Avatar } from '@/components/avatar';
import { SellerTabBar } from '@/components/seller/seller-tab-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PortalTopbar } from '@/components/portal-topbar';
import { SearchProvider } from '@/components/portal-search';

const LINKS = [
  { href: '/seller', label: 'Open cycles' },
  { href: '/seller/bids', label: 'My bids' },
  { href: '/seller/orders', label: 'Orders' },
  { href: '/seller/allocations', label: 'Allocations' },
  { href: '/seller/payouts', label: 'Payouts' },
  { href: '/seller/kyc', label: 'KYC verification' },
  { href: '/seller/settings', label: 'Settings' },
];

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'KYC not started',
  PENDING: 'KYC pending review',
  APPROVED: 'KYC verified',
  REJECTED: 'KYC rejected',
};

export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const profile = await getSellerProfile(sellerId);
  if (!profile) redirect('/seller/login');

  const { notifications, unreadCount } = await getNotificationsForSeller(sellerId);

  return (
    <SearchProvider portal="seller">
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
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPinIcon className="size-3.5" />
                    {profile.regionsServed.join(', ')}
                  </div>
                  <Badge variant="outline" className={`mb-3 w-fit ${pillClass(kycStatusTone(profile.kycStatus))}`}>
                    {KYC_LABEL[profile.kycStatus]}
                  </Badge>
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
            <div className="ml-auto flex items-center gap-1">
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <Link href="/seller/settings" aria-label="Settings" className="rounded-full">
                <Avatar name={profile.user.businessName ?? profile.user.name} className="size-9 text-xs" />
              </Link>
            </div>
          </header>
          <PortalTopbar
            portal="seller"
            name={profile.user.businessName ?? profile.user.name}
            bellSlot={<NotificationBell notifications={notifications} unreadCount={unreadCount} />}
          />
          <main className="flex flex-1 flex-col">{children}</main>
          <SellerTabBar />
        </div>
      </div>
    </SearchProvider>
  );
}
