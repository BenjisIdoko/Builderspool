'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInBuyer } from '@/app/login/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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

        <label className="flex items-center gap-2 text-sm text-slate">
          <input type="checkbox" name="remember" className="size-4 rounded border-input" />
          Remember me
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
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
