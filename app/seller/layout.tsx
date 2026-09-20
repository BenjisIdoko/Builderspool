import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/seller/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'BP Seller', statusBarStyle: 'default' },
};

export default function SellerRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
