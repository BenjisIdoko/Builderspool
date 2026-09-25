'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WarningCircleIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';

// Storefront error boundary: a transient failure (most often a database
// connection hiccup) shows a calm retry screen inside the normal header and
// tab bar, instead of a blank crash page. reset() re-runs the failed render.
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Storefront page failed to load:', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 pt-28 pb-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningCircleIcon className="size-6" />
      </span>
      <div>
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          This is usually a brief connection problem. Try again — your cart is safe.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/catalog">Browse the catalogue</Link>
        </Button>
      </div>
    </div>
  );
}
