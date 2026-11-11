'use client';

import { useRef, useState, useTransition } from 'react';
import { addStaffAction } from '@/app/seller/(dashboard)/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InviteLinkPanel } from '@/components/seller/invite-link-panel';

export function AddStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [invite, setInvite] = useState<{ name: string; inviteUrl: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setInvite(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addStaffAction(formData);
      if ('error' in result) setMessage({ tone: 'error', text: result.error });
      else {
        setInvite({ name: result.name, inviteUrl: result.inviteUrl });
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-lg bg-card-alt p-5">
      <div>
        <h2 className="text-heading-sm text-ink">Add a staff member</h2>
        <p className="mt-1 max-w-[64ch] text-pretty text-sm text-muted-foreground">
          They get their own login. You&apos;ll get a private link to send them, and they choose their own password.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="staff-name" className="mb-1.5">
            Name
          </Label>
          <Input id="staff-name" name="name" required autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="staff-email" className="mb-1.5">
            Email
          </Label>
          <Input id="staff-email" name="email" type="email" required autoComplete="off" />
        </div>
      </div>
      {invite && <InviteLinkPanel name={invite.name} inviteUrl={invite.inviteUrl} onDismiss={() => setInvite(null)} />}
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {message && (
          <p className={`text-pretty text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role={message.tone === 'error' ? 'alert' : 'status'}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? 'Adding…' : 'Add staff member'}
        </Button>
      </div>
    </form>
  );
}
