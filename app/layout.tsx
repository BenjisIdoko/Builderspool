import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

// One text face (DESIGN.md v3.0): Plus Jakarta Sans is a variable font, so all
// weights come from one file per subset. The naira sign (U+20A6) lives in the
// latin-ext subset, so both are loaded — the browser fetches latin-ext because
// every page shows a price. Geist Mono is for figures only.
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
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
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
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
