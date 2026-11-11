'use client';

import { useState, useTransition } from 'react';
import { saveZoneCoverageAction } from '@/app/seller/(dashboard)/settings/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type ZoneRow = { id: string; name: string; status: 'PENDING' | 'APPROVED' | 'REVOKED' | null };

const STATUS_BADGE = {
  PENDING: { label: 'Waiting for approval', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REVOKED: { label: 'Not approved', variant: 'danger' },
} as const;

export function ZoneCoverageForm({ zones, nationalSupply, canEdit }: { zones: ZoneRow[]; nationalSupply: boolean; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await saveZoneCoverageAction(fd);
      setMessage('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: 'Saved. New requests wait for approval.' });
    });
  }

  if (nationalSupply) {
    return <p className="text-sm text-ink">Your account supplies <strong>every delivery zone</strong> (national supply), so there is nothing to choose.</p>;
  }
  if (zones.length === 0) {
    return <p className="text-sm text-muted-foreground">No delivery zones have been set up yet.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ul className="divide-y divide-hairline rounded-md bg-surface">
        {zones.map((z) => {
          const locked = z.status === 'APPROVED';
          const badge = z.status ? STATUS_BADGE[z.status] : null;
          return (
            <li key={z.id}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5">
                <Checkbox name="zoneId" value={z.id} defaultChecked={z.status === 'PENDING' || z.status === 'APPROVED'} disabled={!canEdit || locked} />
                {locked && <input type="hidden" name="zoneId" value={z.id} />}
                <span className="min-w-0 flex-1 text-body text-ink">{z.name}</span>
                {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        {canEdit && (
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save delivery zones'}
          </Button>
        )}
        {!canEdit && <p className="text-caption text-muted-foreground">Only the account owner can change this.</p>}
        {message && (
          <span className={`text-caption ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role="status">
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
