'use client';

import { useRef, useState, useTransition } from 'react';
import { addStaffAction } from '@/app/seller/(dashboard)/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addStaffAction(formData);
      if ('error' in result) setMessage({ tone: 'error', text: result.error });
      else {
        setMessage({ tone: 'success', text: 'Staff account created. Share the starting password with them privately.' });
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4 rounded-lg bg-card-alt p-5">
      <h2 className="text-heading-sm text-ink">Add a staff member</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="staff-name" className="mb-1.5 text-xs text-muted-foreground">
            Name
          </Label>
          <Input id="staff-name" name="name" required autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="staff-email" className="mb-1.5 text-xs text-muted-foreground">
            Email
          </Label>
          <Input id="staff-email" name="email" type="email" required autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="staff-password" className="mb-1.5 text-xs text-muted-foreground">
            Starting password
          </Label>
          <Input id="staff-password" name="password" type="text" minLength={8} required autoComplete="off" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        {message && (
          <p className={`text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`} role="status">
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add staff member'}
        </Button>
      </div>
    </form>
  );
}
