'use client';

import { useEffect } from 'react';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ErrorIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';

// Root error boundary for the seller and admin areas (the storefront has its own).
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page failed to load:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6">
      <EmptyState
        illustration={ErrorIllustration}
        as="h1"
        title="Something went wrong"
        description="This is usually a brief connection problem. Try again in a moment."
      >
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </EmptyState>
    </div>
  );
}
