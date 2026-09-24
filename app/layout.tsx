import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'Builders Pool', template: '%s · Builders Pool' },
  description: 'Construction materials, sourced and delivered.',
  applicationName: 'Builders Pool',
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Builders Pool', statusBarStyle: 'default' },
};

// viewport-fit=cover lets the app draw under the notch / home indicator; the
// mobile tab bar pads itself with env(safe-area-inset-bottom).
export const viewport: Viewport = {
  themeColor: '#2954e5',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">{children}
        <PwaRegister />
      </body>
    </html>
  );
}
