'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/auth/passwordReset';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const LOGIN_PATH: Record<string, string> = {
  buyer: '/login',
  seller: '/seller/login',
  admin: '/admin/login',
};

export function ForgotPasswordForm({ role }: { role: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ message?: string; error?: string } | null>(null);
  const loginPath = LOGIN_PATH[role] ?? '/login';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestPasswordReset(formData);
      setResult(res);
    });
  }

  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Forgot password</h2>
      <p className="mb-7 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {result?.message ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink">{result.message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1.5 text-xs text-muted-foreground">
              Email
            </Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          {result?.error && <p className="text-sm text-danger">{result.error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href={loginPath} className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
