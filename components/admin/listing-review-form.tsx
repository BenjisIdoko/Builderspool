'use client';

import { useState, useTransition } from 'react';
import { decideListingAction } from '@/app/admin/(dashboard)/listings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ListingReviewForm({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: 'approve' | 'reject', form: HTMLFormElement) {
    setError(null);
    const fd = new FormData(form);
    fd.set('decision', decision);
    startTransition(async () => {
      const r = await decideListingAction(fd);
      if ('error' in r) setError(r.error);
    });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="listingId" value={listingId} />
      <Input name="note" placeholder="Note to seller (needed to reject)" aria-label="Note to seller" maxLength={500} className="h-9 min-w-56 flex-1" />
      <Button type="button" size="sm" disabled={isPending} onClick={(e) => decide('approve', e.currentTarget.form!)}>
        Approve
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={(e) => decide('reject', e.currentTarget.form!)}>
        Reject
      </Button>
      {error && (
        <span className="w-full text-caption text-danger" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
