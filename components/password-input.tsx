'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/ssr';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';

// Password field with a show/hide toggle — replaces the "confirm password"
// field on sign-up (typos are visible instead of guessed at).
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className={cn(className, 'pr-12')} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-ink focus-visible:text-ink"
      >
        {show ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  );
}
