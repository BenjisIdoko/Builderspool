'use client';

import { useState, useTransition } from 'react';
import { reissueStaffInviteAction } from '@/app/seller/(dashboard)/team/actions';
import { Button } from '@/components/ui/button';
import { InviteLinkPanel } from '@/components/seller/invite-link-panel';

// For a staff member who has not used their invite yet: issues a fresh link
// (the old one stops working) and shows it once.
export function ReissueInviteButton({ staffUserId }: { staffUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ name: string; inviteUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function issue() {
    setError(null);
    const formData = new FormData();
    formData.set('staffUserId', staffUserId);
    startTransition(async () => {
      const r = await reissueStaffInviteAction(formData);
      if ('error' in r) setError(r.error);
      else setResult({ name: r.name, inviteUrl: r.inviteUrl });
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={issue} disabled={isPending}>
        {isPending ? 'Creating…' : 'New invite link'}
      </Button>
      {error && <p className="text-caption text-danger">{error}</p>}
      {result && (
        <div className="w-[min(32rem,80vw)] self-stretch">
          <InviteLinkPanel name={result.name} inviteUrl={result.inviteUrl} onDismiss={() => setResult(null)} />
        </div>
      )}
    </div>
  );
}
