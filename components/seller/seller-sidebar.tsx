'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GaugeIcon, IdentificationCardIcon, MapPinIcon, SignOutIcon, StackIcon, TruckIcon } from '@phosphor-icons/react/ssr';
import { signOutSeller } from '@/app/seller/actions';
import type { getSellerProfile } from '@/lib/queries/sellerPortal';
import type { getNotificationsForSeller } from '@/lib/notifications';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { LogoMark } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './notification-bell';

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'KYC not started',
  PENDING: 'KYC pending review',
  APPROVED: 'KYC verified',
  REJECTED: 'KYC rejected',
};

const LINK_GROUPS = [
  {
    label: 'Overview',
    links: [{ href: '/seller', label: 'Open cycles', icon: GaugeIcon }],
  },
  {
    label: 'Commerce',
    links: [
      { href: '/seller/bids', label: 'My bids', icon: StackIcon },
      { href: '/seller/allocations', label: 'Allocations', icon: TruckIcon },
    ],
  },
  {
    label: 'Account',
    links: [{ href: '/seller/kyc', label: 'KYC verification', icon: IdentificationCardIcon }],
  },
];

export function SellerSidebar({
  profile,
  notifications,
  unreadCount,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getSellerProfile>>>;
  notifications: Awaited<ReturnType<typeof getNotificationsForSeller>>['notifications'];
  unreadCount: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-5">
        <Link href="/seller" className="flex min-w-0 items-center gap-2">
          <LogoMark className="size-8 shrink-0" />
          <span className="truncate text-[15px] font-medium tracking-tight text-ink">Seller portal</span>
        </Link>
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      </div>

      <nav className="flex flex-col gap-5 p-3">
        {LINK_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-3 text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </div>
            <div className="flex flex-col gap-1">
              {group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'bg-brand/10 text-brand' : 'text-slate hover:bg-well hover:text-ink'
                    }`}
                  >
                    <link.icon className="size-4.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-4">
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
      </div>
    </aside>
  );
}
