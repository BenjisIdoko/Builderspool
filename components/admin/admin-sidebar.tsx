'use client';

import Link from 'next/link';
import { LogoTile } from '@/components/logo';
import { usePathname } from 'next/navigation';
import {
  BooksIcon,
  CaretUpDownIcon,
  DotsThreeVerticalIcon,
  ClockCounterClockwiseIcon,
  GaugeIcon,
  ListChecksIcon,
  MapPinIcon,
  GearIcon,
  LockKeyIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  StackIcon,
  StorefrontIcon,
  TruckIcon,
  UsersIcon,
  UsersThreeIcon,
  WalletIcon,
} from '@phosphor-icons/react/ssr';
import { signOutAdmin } from '@/app/admin/actions';
import { Avatar } from '@/components/avatar';
import { SidebarSearchTrigger } from '@/components/portal-search';

const LINK_GROUPS = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: GaugeIcon }],
  },
  {
    label: 'Commerce',
    links: [
      { href: '/admin/orders', label: 'Orders', icon: ReceiptIcon },
      { href: '/admin/sellers', label: 'Sellers', icon: StorefrontIcon },
      { href: '/admin/materials', label: 'Materials', icon: PackageIcon },
      { href: '/admin/catalogue-reference', label: 'Catalogue reference', icon: BooksIcon },
      { href: '/admin/listings', label: 'Listing review', icon: ListChecksIcon },
      { href: '/admin/direct', label: 'Buy Direct orders', icon: ReceiptIcon },
      { href: '/admin/areas', label: 'Service areas', icon: MapPinIcon },
      { href: '/admin/sheets', label: 'Pool sheets', icon: StackIcon },
      { href: '/admin/haulage', label: 'Haulage & dispatch', icon: TruckIcon },
      { href: '/admin/escrow', label: 'Escrow settlement', icon: LockKeyIcon },
      { href: '/admin/savings', label: 'Savings settlement', icon: WalletIcon },
    ],
  },
  {
    label: 'Account',
    links: [
      { href: '/admin/users', label: 'Users', icon: UsersIcon },
      { href: '/admin/team', label: 'Operations team', icon: UsersThreeIcon },
      { href: '/admin/verification', label: 'Vendor verification', icon: ShieldCheckIcon },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/admin/settings', label: 'Settings', icon: GearIcon },
      { href: '/admin/audit-log', label: 'Audit log', icon: ClockCounterClockwiseIcon },
    ],
  },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col bg-ink text-white lg:flex">
      <Link href="/admin" className="flex items-center justify-between gap-2 border-b border-white/10 px-[18px] py-[22px] pb-4">
        <span className="flex items-center gap-2.5">
          <LogoTile className="size-9" />
          <span className="leading-tight">
            <span className="block font-display text-[14.5px] font-extrabold tracking-[-0.02em] text-white">BUILDERS<span className="text-orange">POOL</span></span>
            <span className="block text-[11px] font-semibold tracking-wide text-white/60">Admin portal</span>
          </span>
        </span>
        <CaretUpDownIcon className="size-3.5 text-white/40" />
      </Link>

      <div className="px-[18px] pt-3.5 pb-2">
        <SidebarSearchTrigger />
      </div>

      <nav className="flex flex-col gap-5 p-3">
        {LINK_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="mb-1.5 px-3 text-[10.5px] font-bold tracking-wide text-white/50 uppercase">
              {group.label}
            </div>
            <div className="flex flex-col gap-1">
              {group.links.map((link) => {
                const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
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

      <div className="mt-auto p-3.5">
        <div className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5">
          <Avatar name={adminName} className="size-8 shrink-0 bg-white! text-xs text-ink!" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-white">{adminName}</div>
            <form action={signOutAdmin}>
              <button type="submit" className="text-[11.5px] text-white/70 hover:text-white hover:underline">
                Sign out
              </button>
            </form>
          </div>
          <DotsThreeVerticalIcon className="size-3.5 shrink-0 text-white/40" />
        </div>
      </div>
    </aside>
  );
}
