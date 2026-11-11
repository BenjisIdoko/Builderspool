'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REVOKED' | null;
export type ApprovalItem = { key: string; label: string; status: ApprovalStatus };

const STATUS_BADGE = {
  PENDING: { label: 'Waiting for approval', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REVOKED: { label: 'Not approved', variant: 'danger' },
} as const;

// A tick-list the seller asks BuildersPool to approve (delivery zones, categories).
// Ticking sends a request; an approved row stays ticked and is only removed by our team.
export function ApprovalChecklist({
  name,
  items,
  canEdit,
  saveLabel,
  save,
}: {
  name: string;
  items: ApprovalItem[];
  canEdit: boolean;
  saveLabel: string;
  save: (fd: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const hasApproved = items.some((i) => i.status === 'APPROVED');

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await save(fd);
      setMessage('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: 'Saved. New requests wait for approval.' });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ul className="divide-y divide-hairline overflow-hidden rounded-md bg-surface">
        {items.map((item) => {
          const locked = item.status === 'APPROVED';
          const badge = item.status ? STATUS_BADGE[item.status] : null;
          return (
            <li key={item.key}>
              <label
                className={`flex min-h-12 items-center gap-3 px-4 py-2.5 transition-colors duration-150 has-focus-visible:ring-2 has-focus-visible:ring-inset has-focus-visible:ring-ring ${
                  canEdit && !locked ? 'cursor-pointer hover:bg-well/60' : ''
                }`}
              >
                <Checkbox name={name} value={item.key} defaultChecked={item.status === 'PENDING' || item.status === 'APPROVED'} disabled={!canEdit || locked} />
                {locked && <input type="hidden" name={name} value={item.key} />}
                <span className="min-w-0 flex-1 text-pretty text-body text-ink">{item.label}</span>
                {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              </label>
            </li>
          );
        })}
      </ul>
      {hasApproved && canEdit && <p className="text-caption text-muted-foreground">Approved rows stay ticked. Our team removes them if needed.</p>}
      <div className="flex flex-wrap items-center gap-3">
        {canEdit ? (
          <Button type="submit" disabled={isPending} aria-busy={isPending}>
            {isPending ? 'Saving…' : saveLabel}
          </Button>
        ) : (
          <p className="text-caption text-muted-foreground">Only the account owner can change this.</p>
        )}
        {message && (
          <span className={`text-pretty text-caption ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role={message.tone === 'error' ? 'alert' : 'status'}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
