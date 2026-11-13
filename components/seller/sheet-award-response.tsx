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
        <p className="max-w-[64ch] text-pretty text-sm text-ink">Decline this offer? It passes to the next ranked vendor and you can&apos;t undo this.</p>
      )}
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
            <Button type="button" disabled={isPending} aria-busy={isPending} onClick={() => run(() => acceptSheetAwardAction(sheetId, awardId))}>
              {isPending ? 'Accepting…' : 'Accept the whole sheet'}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setDeclining(true)}>
              Decline
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="destructive" disabled={isPending} aria-busy={isPending} onClick={() => run(() => declineSheetAwardAction(sheetId, awardId, reason))}>
              {isPending ? 'Declining…' : 'Decline offer'}
            </Button>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setDeclining(false)}>
              Keep offer
            </Button>
          </>
        )}
      </div>
      {error && (
        <p className="text-pretty text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
