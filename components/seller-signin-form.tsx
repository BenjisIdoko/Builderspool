'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInSeller } from '@/app/seller/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function SellerSignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await signInSeller(formData);
        router.push('/seller');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not sign in.');
      }
    });
  }

  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Seller login</h2>
      <p className="mb-7 text-sm text-muted-foreground">Sign in to submit bids and manage allocations.</p>

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

      <p className="mt-6 text-sm text-muted-foreground">
        New supplier?{' '}
        <Link href="/seller/signup" className="font-medium text-brand hover:underline">
          Register as a seller
        </Link>
      </p>
    </>
  );
}
