'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signInAdmin } from '@/app/admin/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function AdminSignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await signInAdmin(formData);
        router.push('/admin');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not sign in.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-1.5 text-xs text-muted-foreground">
          Email
        </Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password" className="mb-1.5 text-xs text-muted-foreground">
          Password
        </Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
