'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth/passwordReset';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const LOGIN_PATH: Record<string, string> = {
  buyer: '/login',
  seller: '/seller/login',
  admin: '/admin/login',
};

export function ResetPasswordForm({ token, role }: { token: string; role: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const loginPath = LOGIN_PATH[role] ?? '/login';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('token', token);
    startTransition(async () => {
      const result = await resetPassword(formData);
      if ('error' in result) setError(result.error);
      else setSuccess(true);
    });
  }

  if (success) {
    return (
      <>
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Password reset</h2>
        <p className="mb-7 text-sm text-muted-foreground">Your password has been updated.</p>
        <Link href={loginPath}>
          <Button size="lg" className="w-full">
            Sign in
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Choose a new password</h2>
      <p className="mb-7 text-sm text-muted-foreground">Must be at least 8 characters.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password" className="mb-1.5 text-xs text-muted-foreground">
            New password
          </Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
        </div>
        <div>
          <Label htmlFor="confirmPassword" className="mb-1.5 text-xs text-muted-foreground">
            Confirm password
          </Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href={`/forgot-password?role=${role}`} className="font-medium text-brand hover:underline">
          Request a new link
        </Link>
      </p>
    </>
  );
}
