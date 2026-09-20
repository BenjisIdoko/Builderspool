import { LogoMark } from '@/components/logo';

export const metadata = { title: 'Offline — Builders Pool' };

// Shown by the service worker (public/sw.js) when a page load fails offline.
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <LogoMark className="size-12" />
      <h1 className="text-xl font-bold tracking-tight text-ink">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Builders Pool needs a connection to load prices and your cart. Check your signal and try again.
      </p>
    </div>
  );
}
