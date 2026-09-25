'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpBuyer } from '@/app/login/actions';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AUTH_INPUT, AUTH_LABEL, AUTH_BUTTON } from '@/components/auth-field-styles';

export function BuyerSignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUpBuyer(formData);
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
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">Create your account</h2>
      <p className="mb-7 text-sm text-muted-foreground">Buy materials at a fixed price, pooled with other buyers. Takes under a minute.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name" className={AUTH_LABEL}>
            Full name
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
          <Label htmlFor="password" className={AUTH_LABEL}>
            Password
          </Label>
          <PasswordInput className={AUTH_INPUT} id="password" name="password" required autoComplete="new-password" minLength={8} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" className={AUTH_BUTTON} disabled={isPending}>
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
