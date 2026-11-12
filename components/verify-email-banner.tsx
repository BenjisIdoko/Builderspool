'use client';

import { useState, useTransition } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import { resendVerificationEmailAction } from '@/lib/auth/emailVerification';

// Non-blocking by design — this never gates any real functionality, it's
// just a dismissible nudge. Dismissal is per-session (component state, not
// persisted) since there's no real preference to store for "stop asking."
export function VerifyEmailBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (dismissed) return null;

  function handleResend() {
    startTransition(async () => {
      const result = await resendVerificationEmailAction();
      setMessage('message' in result ? result.message : result.error);
    });
  }

  return (
    <div role="status" className="mb-6 flex items-start justify-between gap-2 rounded-lg bg-warning-soft px-4 py-2 text-sm text-warning-text ring-1 ring-warning/30">
      <div className="min-w-0 flex-1 self-center py-1 text-pretty">
        {message ?? 'Verify your email to help keep your account secure.'}{' '}
        {!message && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold underline outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {isPending ? 'Sending…' : 'Resend verification email'}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-warning-text/70 outline-none transition-colors duration-150 hover:text-warning-text focus-visible:ring-2 focus-visible:ring-ring"
      >
        <XIcon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
