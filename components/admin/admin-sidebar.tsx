'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BooksIcon,
  GaugeIcon,
  LockKeyIcon,
  PackageIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SignOutIcon,
  TruckIcon,
  UsersIcon,
} from '@phosphor-icons/react/ssr';
import { signOutAdmin } from '@/app/admin/actions';
import { LogoMark } from '@/components/logo';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';

const LINK_GROUPS = [
  {
    label: 'Overview',
    links: [{ href: '/admin', label: 'Dashboard', icon: GaugeIcon }],
  },
  {
    label: 'Commerce',
    links: [
      { href: '/admin/orders', label: 'Orders', icon: ReceiptIcon },
      { href: '/admin/materials', label: 'Materials', icon: PackageIcon },
      { href: '/admin/catalogue-reference', label: 'Catalogue reference', icon: BooksIcon },
      { href: '/admin/haulage', label: 'Haulage & dispatch', icon: TruckIcon },
      { href: '/admin/escrow', label: 'Escrow settlement', icon: LockKeyIcon },
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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <Link href="/admin" className="flex items-center gap-2 border-b border-border px-5 py-5">
        <LogoMark className="size-8" />
        <span className="text-[15px] font-medium tracking-tight text-ink">Ops admin</span>
      </Link>

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

      <div className="mt-auto border-t border-border p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <Avatar name={adminName} className="size-8 text-xs" />
          <div className="text-sm font-semibold text-ink">{adminName}</div>
        </div>
        <form action={signOutAdmin}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 px-2">
            <SignOutIcon className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
