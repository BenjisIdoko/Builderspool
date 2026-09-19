'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpSeller } from '@/app/seller/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AUTH_INPUT, AUTH_LABEL, AUTH_BUTTON, AUTH_SELECT } from '@/components/auth-field-styles';

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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="businessName" className={AUTH_LABEL}>
            Business name
          </Label>
          <Input className={AUTH_INPUT} id="businessName" name="businessName" required />
        </div>
        <div>
          <Label htmlFor="name" className={AUTH_LABEL}>
            Contact name
          </Label>
          <Input className={AUTH_INPUT} id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email" className={AUTH_LABEL}>
            Email
          </Label>
          <Input className={AUTH_INPUT} id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="location" className={AUTH_LABEL}>
            Primary region
          </Label>
          <select
            id="location"
            name="location"
            required
            defaultValue=""
            className={AUTH_SELECT}
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
          <Label htmlFor="password" className={AUTH_LABEL}>
            Password
          </Label>
          <Input className={AUTH_INPUT} id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirmPassword" className={AUTH_LABEL}>
            Confirm password
          </Label>
          <Input className={AUTH_INPUT}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className={AUTH_BUTTON} disabled={isPending}>
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
