'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BooksIcon, GaugeIcon, ReceiptIcon, SignOutIcon } from '@phosphor-icons/react/ssr';
import { signOutAdmin } from '@/app/admin/actions';
import { LogoMark } from '@/components/logo';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';

const LINKS = [
  { href: '/admin', label: 'Bid cycles', icon: GaugeIcon },
  { href: '/admin/orders', label: 'Orders', icon: ReceiptIcon },
  { href: '/admin/catalogue-reference', label: 'Catalogue reference', icon: BooksIcon },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <Link href="/admin" className="flex items-center gap-2 border-b border-border px-5 py-5">
        <LogoMark className="size-8" />
        <span className="text-[15px] font-medium tracking-tight text-ink">Ops admin</span>
      </Link>

      <nav className="flex flex-col gap-1 p-3">
        {LINKS.map((link) => {
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
