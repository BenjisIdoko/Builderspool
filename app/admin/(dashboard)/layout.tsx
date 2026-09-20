import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin/session';
import { getPendingVerificationCount } from '@/lib/queries/adminVerification';
import { getMaterialsNeedingPriceReviewCount } from '@/lib/queries/adminMaterials';
import { getPendingGrnCount } from '@/lib/queries/adminStats';
import { signOutAdmin } from '../actions';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminAlertsBell } from '@/components/admin/admin-alerts-bell';
import { MobileNav } from '@/components/mobile-nav';
import { LogoMark } from '@/components/logo';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import { PortalTopbar } from '@/components/portal-topbar';
import { SearchProvider } from '@/components/portal-search';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/catalogue-reference', label: 'Catalogue reference' },
  { href: '/admin/users', label: 'Users' },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const [pendingVerificationCount, priceReviewCount, pendingGrnCount] = await Promise.all([
    getPendingVerificationCount(),
    getMaterialsNeedingPriceReviewCount(),
    getPendingGrnCount(),
  ]);
  const alertsCount = pendingVerificationCount + priceReviewCount + pendingGrnCount;

  return (
    <SearchProvider portal="admin">
      <div className="flex flex-1">
        <AdminSidebar adminName={admin.name} />
        <div className="flex min-w-0 flex-1 flex-col">
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
          <PortalTopbar portal="admin" name={admin.name} bellSlot={<AdminAlertsBell count={alertsCount} />} />
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </div>
    </SearchProvider>
  );
}
