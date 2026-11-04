'use client';

import { useRef, useState, useTransition } from 'react';
import { createTeamMemberAction } from '@/app/admin/(dashboard)/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_OPTIONS = [
  { value: 'QC_OFFICER', label: 'QC officer' },
  { value: 'FULFILMENT_OPERATOR', label: 'Fulfilment operator' },
  { value: 'DELIVERY_PARTNER', label: 'Delivery partner' },
];

export function CreateTeamMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTeamMemberAction(formData);
      if ('error' in result) setMessage({ tone: 'error', text: result.error });
      else {
        setMessage({ tone: 'success', text: 'Account created. Share the starting password privately.' });
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-bold text-slate">Add a team member</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="member-role" className="mb-1.5 text-xs text-muted-foreground">
            Role
          </Label>
          <select
            id="member-role"
            name="role"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select a role
            </option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="member-name" className="mb-1.5 text-xs text-muted-foreground">
            Name
          </Label>
          <Input id="member-name" name="name" required autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="member-email" className="mb-1.5 text-xs text-muted-foreground">
            Email
          </Label>
          <Input id="member-email" name="email" type="email" required autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="member-password" className="mb-1.5 text-xs text-muted-foreground">
            Starting password
          </Label>
          <Input id="member-password" name="password" type="text" minLength={8} required autoComplete="off" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        {message && (
          <p className={`text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role="status">
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
