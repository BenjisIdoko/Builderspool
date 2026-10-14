import { EmptyState } from '@/components/empty-state/empty-state';
import { OfflineIllustration } from '@/components/empty-state/illustrations';

export const metadata = { title: 'Offline — Builders Pool' };

// Shown by the service worker (public/sw.js) when a page load fails offline.
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6">
      <EmptyState
        illustration={OfflineIllustration}
        as="h1"
        title="You're offline"
        description="Builders Pool needs a connection to load prices and your cart. Check your signal and try again."
      />
    </div>
  );
}
