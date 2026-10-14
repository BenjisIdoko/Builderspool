'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ErrorIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';

// Storefront error boundary: a transient failure (most often a database
// connection hiccup) shows a calm retry screen inside the normal header and
// tab bar, instead of a blank crash page. reset() re-runs the failed render.
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Storefront page failed to load:', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pt-28 pb-24">
      <EmptyState
        illustration={ErrorIllustration}
        as="h1"
        title="Something went wrong"
        description="This is usually a brief connection problem. Try again — your cart is safe."
      >
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog">Browse the catalogue</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
