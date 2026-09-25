'use client';

import { useEffect } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';

// Root error boundary for the seller and admin areas (the storefront has its own).
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page failed to load:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningCircleIcon className="size-6" />
      </span>
      <div>
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">This is usually a brief connection problem. Try again in a moment.</p>
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
