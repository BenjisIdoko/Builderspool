'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CaretUpDownIcon,
  DotsThreeVerticalIcon,
  GaugeIcon,
  GearIcon,
  IdentificationCardIcon,
  ReceiptIcon,
  StackIcon,
  TruckIcon,
  WalletIcon,
} from '@phosphor-icons/react/ssr';
import { signOutSeller } from '@/app/seller/actions';
import type { getSellerProfile } from '@/lib/queries/sellerPortal';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { Avatar } from '@/components/avatar';
import { SidebarSearchTrigger } from '@/components/portal-search';

const KYC_BADGE_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not started',
  PENDING: 'Pending',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
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
      { href: '/seller/orders', label: 'Orders', icon: ReceiptIcon },
      { href: '/seller/allocations', label: 'Allocations', icon: TruckIcon },
      { href: '/seller/payouts', label: 'Payouts', icon: WalletIcon },
    ],
  },
  {
    label: 'Account',
    links: [
      { href: '/seller/kyc', label: 'KYC verification', icon: IdentificationCardIcon },
      { href: '/seller/settings', label: 'Settings', icon: GearIcon },
    ],
  },
];

export function SellerSidebar({
  profile,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getSellerProfile>>>;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-border bg-surface shadow-[1px_0_0_#eef0f3,6px_0_32px_rgba(16,24,40,0.05)] lg:flex">
      <Link href="/seller" className="flex items-center justify-between gap-2 border-b border-border px-[18px] py-[22px] pb-4">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4d7bff] to-brand text-[13px] font-extrabold text-white shadow-[0_4px_14px_rgba(41,84,229,0.35)]">
            BP
          </span>
          <span className="leading-tight">
            <span className="block text-[14.5px] font-extrabold text-ink">Builders Pool</span>
            <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground">Seller portal</span>
          </span>
        </span>
        <CaretUpDownIcon className="size-3.5 text-border-strong" />
      </Link>

      <div className="px-[18px] pt-3.5 pb-2">
        <SidebarSearchTrigger />
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
                    <span className="flex-1">{link.label}</span>
                    {link.href === '/seller/kyc' && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${pillClass(kycStatusTone(profile.kycStatus))}`}>
                        {KYC_BADGE_LABEL[profile.kycStatus]}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto p-3.5">
        <div
          className="flex items-center gap-2.5 rounded-xl border border-border bg-well/60 px-3 py-2.5"
          title={profile.regionsServed.join(', ')}
        >
          <Avatar
            name={profile.user.businessName ?? profile.user.name}
            className="size-8 shrink-0 text-xs shadow-[0_4px_10px_rgba(41,84,229,0.3)]"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-ink">
              {profile.user.businessName ?? profile.user.name}
            </div>
            <form action={signOutSeller}>
              <button type="submit" className="text-[11.5px] text-muted-foreground hover:underline">
                Sign out
              </button>
            </form>
          </div>
          <DotsThreeVerticalIcon className="size-3.5 shrink-0 text-border-strong" />
        </div>
      </div>
    </aside>
  );
}
