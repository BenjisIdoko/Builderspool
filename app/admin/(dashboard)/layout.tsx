import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminSignedIn } from '@/lib/admin/session';
import { getDemoAdmin } from '@/lib/demoAdmin';
import { signOutAdmin } from '../actions';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { LogoMark } from '@/components/logo';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/catalogue-reference', label: 'Catalogue reference' },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await isAdminSignedIn();
  if (!signedIn) redirect('/admin/login');

  const admin = await getDemoAdmin();

  return (
    <div className="flex flex-1">
      <AdminSidebar adminName={admin.name} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-5 backdrop-blur lg:hidden">
          <MobileNav
            links={LINKS}
            title="Ops admin"
            hideFrom="lg"
            footer={
              <>
                <div className="mb-3 flex items-center gap-2.5">
                  <Avatar name={admin.name} className="size-8 text-xs" />
                  <div className="text-sm font-semibold text-ink">{admin.name}</div>
                </div>
                <form action={signOutAdmin}>
                  <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 px-2">
                    Sign out
                  </Button>
                </form>
              </>
            }
          />
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="size-7" />
            <span className="text-sm font-medium tracking-tight text-ink">Ops admin</span>
          </Link>
          <Avatar name={admin.name} className="ml-auto size-8 text-xs" />
        </header>
        <div className="hidden h-16 shrink-0 items-center justify-end border-b border-border bg-surface px-6 lg:flex">
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-sm font-semibold text-ink">{admin.name}</div>
              <div className="text-xs text-muted-foreground">Ops admin</div>
            </div>
            <Avatar name={admin.name} className="size-9 text-xs" />
          </div>
        </div>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
