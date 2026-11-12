'use client';

import { useState, useTransition } from 'react';
import { acceptAllocation, declineAllocation } from '@/app/seller/actions';
import { Button } from '@/components/ui/button';

// Accept or decline one award. Declining asks first, in place, because the award then passes to the
// next supplier and cannot be taken back.
export function AwardResponse({ allocationId }: { allocationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  function respond(action: typeof acceptAllocation) {
    setError(null);
    const formData = new FormData();
    formData.set('allocationId', allocationId);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-1.5">
      {confirmingDecline ? (
        <div className="space-y-2">
          <p className="text-pretty text-sm text-ink">Decline this award? It goes to the next supplier and you can&apos;t undo this.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" className="max-sm:h-11" disabled={isPending} aria-busy={isPending} onClick={() => respond(declineAllocation)}>
              {isPending ? 'Declining…' : 'Decline award'}
            </Button>
            <Button size="sm" variant="outline" className="max-sm:h-11" disabled={isPending} onClick={() => setConfirmingDecline(false)}>
              Keep award
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="max-sm:h-11" disabled={isPending} aria-busy={isPending} onClick={() => respond(acceptAllocation)}>
            {isPending ? 'Accepting…' : 'Accept'}
          </Button>
          <Button size="sm" variant="outline" className="max-sm:h-11" disabled={isPending} onClick={() => setConfirmingDecline(true)}>
            Decline
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-pretty text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
