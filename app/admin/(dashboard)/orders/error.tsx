'use client';

import { useEffect } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';

// Next.js App Router error boundary — catches real failures loading this
// route (most commonly the Supabase session-pooler exhaustion documented
// throughout BUILDERSPOOL_PROJECT_BRIEF.md) instead of the default crash
// overlay. reset() re-runs the failed render, which is the right fix for a
// transient DB error like that one.
export default function OrdersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin orders page failed to load:', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningCircleIcon className="size-6" />
      </span>
      <div>
        <h1 className="mb-1 text-lg font-bold text-ink">Couldn&apos;t load orders</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This is usually a transient database connection issue. Try again in a moment.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
