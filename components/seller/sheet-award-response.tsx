'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptSheetAwardAction, declineSheetAwardAction } from '@/app/seller/(dashboard)/rfqs/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Accept or decline the offer to supply the whole sheet. Declining asks for a
// reason and a second click, because the offer then passes to the next rank.
export function SheetAwardResponse({ sheetId, awardId }: { sheetId: string; awardId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error: string } | { ok: true }>) {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if ('error' in r) setError(r.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {declining && (
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you declining? (optional)"
          aria-label="Reason for declining"
          maxLength={300}
          disabled={isPending}
        />
      )}
      <div className="flex flex-wrap gap-3">
        {!declining ? (
          <>
            <Button type="button" disabled={isPending} onClick={() => run(() => acceptSheetAwardAction(sheetId, awardId))}>
              {isPending ? 'Working…' : 'Accept the whole sheet'}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setDeclining(true)}>
              Decline
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => run(() => declineSheetAwardAction(sheetId, awardId, reason))}>
              {isPending ? 'Working…' : 'Confirm decline'}
            </Button>
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => setDeclining(false)}>
              Back
            </Button>
          </>
        )}
      </div>
      {error && (
        <p className="text-caption text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
