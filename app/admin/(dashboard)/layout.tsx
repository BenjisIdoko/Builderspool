import { redirect } from 'next/navigation';
import { isAdminSignedIn } from '@/lib/admin/session';
import { AdminHeader } from '@/components/admin/admin-header';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await isAdminSignedIn();
  if (!signedIn) redirect('/admin/login');

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
