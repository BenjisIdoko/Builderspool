import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Poppins, Roboto } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://builderspool.vercel.app'),
  title: {
    default: 'BuildersPool — Building materials in Abuja: buy direct or pool and save',
    template: '%s · Builders Pool',
  },
  description:
    'Buy cement, steel, blocks and more from verified Abuja suppliers. Buy Direct at listed prices, or Pool & Save with other builders and share the savings.',
  applicationName: 'Builders Pool',
  openGraph: { siteName: 'Builders Pool', type: 'website' },
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Builders Pool', statusBarStyle: 'default' },
};

// viewport-fit=cover lets the app draw under the notch / home indicator; the
// mobile tab bar pads itself with env(safe-area-inset-bottom).
export const viewport: Viewport = {
  themeColor: '#0b1f3a',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${roboto.variable} ${poppins.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {/* Reveal (components/motion/reveal.tsx) server-renders content hidden
            until it scrolls into view; without JS that would never happen. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
