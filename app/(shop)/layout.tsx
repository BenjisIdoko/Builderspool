import { CartProvider } from '@/lib/cart/CartContext';
import { getCurrentBuyer } from '@/lib/buyer/auth';
import { getCartLinesForBuyer } from '@/lib/cart/store';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MobileTabBar } from '@/components/mobile-tab-bar';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const buyer = await getCurrentBuyer();
  const initialLines = buyer ? await getCartLinesForBuyer(buyer.id) : [];

  return (
    <CartProvider buyerId={buyer?.id ?? null} initialLines={initialLines}>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </CartProvider>
  );
}
