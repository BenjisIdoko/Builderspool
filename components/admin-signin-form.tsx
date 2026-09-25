'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInAdmin } from '@/app/admin/actions';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AUTH_INPUT, AUTH_LABEL, AUTH_BUTTON } from '@/components/auth-field-styles';

export function AdminSignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInAdmin(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/admin');
        router.refresh();
      }
    });
  }

  return (
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
          <Link href="/forgot-password?role=admin" className="text-sm font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput className={AUTH_INPUT} id="password" name="password" required autoComplete="current-password" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" className={AUTH_BUTTON} disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
