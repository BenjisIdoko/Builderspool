'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInBuyer } from '@/app/login/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AUTH_INPUT, AUTH_LABEL, AUTH_BUTTON } from '@/components/auth-field-styles';

export function BuyerSignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInBuyer(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/account');
        router.refresh();
      }
    });
  }

  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Login</h2>
      <p className="mb-7 text-sm text-muted-foreground">Sign in to your Builders Pool account.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email" className={AUTH_LABEL}>
            Email
          </Label>
          <Input className={AUTH_INPUT} id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate">
              Password
            </Label>
            <Link href="/forgot-password?role=buyer" className="text-sm font-medium text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input className={AUTH_INPUT} id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        <label className="flex items-center gap-2.5 py-1 text-sm text-slate">
          <input type="checkbox" name="remember" className="size-5 rounded border-input accent-brand" />
          Remember me
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className={AUTH_BUTTON} disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Join Builders Pool
        </Link>
      </p>
    </>
  );
}
