'use client';

import { useState, useTransition } from 'react';
import { resolveSourcingAction } from '@/app/admin/(dashboard)/sourcing/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SourcingForm({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resolve(decision: 'sourced' | 'refund', form: HTMLFormElement) {
    setError(null);
    const fd = new FormData(form);
    fd.set('decision', decision);
    startTransition(async () => {
      const r = await resolveSourcingAction(fd);
      if ('error' in r) setError(r.error);
    });
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="note" placeholder="Supplier used, or why it can't be sourced" aria-label="Note" maxLength={500} className="h-9 min-w-56 flex-1" />
      <Button type="button" size="sm" disabled={isPending} onClick={(e) => resolve('sourced', e.currentTarget.form!)}>
        Mark sourced
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={(e) => resolve('refund', e.currentTarget.form!)}>
        Refund instead
      </Button>
      {error && (
        <span className="w-full text-sm text-danger" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
