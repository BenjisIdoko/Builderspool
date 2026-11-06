'use client';

import { useState, useTransition } from 'react';
import { answerDirectOrderAction } from '@/app/seller/(dashboard)/orders/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DirectOrderActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function answer(decision: 'accept' | 'decline', form: HTMLFormElement) {
    setError(null);
    const fd = new FormData(form);
    fd.set('decision', decision);
    startTransition(async () => {
      const r = await answerDirectOrderAction(fd);
      if ('error' in r) setError(r.error);
    });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="reason" placeholder="Reason, if declining" aria-label="Reason for declining" maxLength={300} className="h-9 min-w-48 flex-1" />
      <Button type="button" size="sm" disabled={isPending} onClick={(e) => answer('accept', e.currentTarget.form!)}>
        Accept
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={(e) => answer('decline', e.currentTarget.form!)}>
        Decline
      </Button>
      {error && (
        <span className="w-full text-caption text-danger" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
