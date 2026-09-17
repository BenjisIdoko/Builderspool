'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpSeller } from '@/app/seller/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function SellerSignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUpSeller(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/seller');
        router.refresh();
      }
    });
  }

  return (
    <>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Register as a seller</h2>
      <p className="mb-7 text-sm text-muted-foreground">
        Bid on pooled demand from buyers across Nigeria. KYC verification is required before payouts.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="businessName" className="mb-1.5 text-xs text-muted-foreground">
            Business name
          </Label>
          <Input id="businessName" name="businessName" required />
        </div>
        <div>
          <Label htmlFor="name" className="mb-1.5 text-xs text-muted-foreground">
            Contact name
          </Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email" className="mb-1.5 text-xs text-muted-foreground">
            Email
          </Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="location" className="mb-1.5 text-xs text-muted-foreground">
            Primary region
          </Label>
          <select
            id="location"
            name="location"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select a region
            </option>
            <option value="ABUJA">Abuja</option>
            <option value="LAGOS">Lagos</option>
            <option value="KANO">Kano</option>
          </select>
        </div>
        <div>
          <Label htmlFor="password" className="mb-1.5 text-xs text-muted-foreground">
            Password
          </Label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirmPassword" className="mb-1.5 text-xs text-muted-foreground">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? 'Creating account…' : 'Create seller account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already registered?{' '}
        <Link href="/seller/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
