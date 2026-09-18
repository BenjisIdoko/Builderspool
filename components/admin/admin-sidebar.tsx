'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BooksIcon,
  CaretUpDownIcon,
  DotsThreeVerticalIcon,
  GaugeIcon,
  LockKeyIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  StorefrontIcon,
  TruckIcon,
  UsersIcon,
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
      { href: '/admin/haulage', label: 'Haulage & dispatch', icon: TruckIcon },
      { href: '/admin/escrow', label: 'Escrow settlement', icon: LockKeyIcon },
      { href: '/admin/savings', label: 'Savings settlement', icon: WalletIcon },
    ],
  },
  {
    label: 'Account',
    links: [
      { href: '/admin/users', label: 'Users', icon: UsersIcon },
      { href: '/admin/verification', label: 'Vendor verification', icon: ShieldCheckIcon },
    ],
  },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-border bg-surface shadow-[1px_0_0_#eef0f3,6px_0_32px_rgba(16,24,40,0.05)] lg:flex">
      <Link href="/admin" className="flex items-center justify-between gap-2 border-b border-border px-[18px] py-[22px] pb-4">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#4d7bff] to-brand text-[13px] font-extrabold text-white shadow-[0_4px_14px_rgba(41,84,229,0.35)]">
            BP
          </span>
          <span className="leading-tight">
            <span className="block text-[14.5px] font-extrabold text-ink">Builders Pool</span>
            <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground">Admin portal</span>
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
                const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
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

      <div className="mt-auto p-3.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-well/60 px-3 py-2.5">
          <Avatar name={adminName} className="size-8 shrink-0 text-xs shadow-[0_4px_10px_rgba(41,84,229,0.3)]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-ink">{adminName}</div>
            <form action={signOutAdmin}>
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
