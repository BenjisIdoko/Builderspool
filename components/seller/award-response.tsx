'use client';

import { useState, useTransition } from 'react';
import { acceptAllocation, declineAllocation } from '@/app/seller/actions';
import { Button } from '@/components/ui/button';

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
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={() => respond(acceptAllocation)}>
          Accept
        </Button>
        {confirmingDecline ? (
          <>
            <Button size="sm" variant="destructive" disabled={isPending} onClick={() => respond(declineAllocation)}>
              Confirm decline
            </Button>
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setConfirmingDecline(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setConfirmingDecline(true)}>
            Decline
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
