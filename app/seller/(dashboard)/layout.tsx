import { redirect } from 'next/navigation';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { SellerHeader } from '@/components/seller/seller-header';

export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const profile = await getSellerProfile(sellerId);
  if (!profile) redirect('/seller/login');

  return (
    <div className="flex flex-1 flex-col">
      <SellerHeader profile={profile} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
