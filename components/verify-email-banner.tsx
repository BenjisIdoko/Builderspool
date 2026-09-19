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
    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
      <div>
        {message ?? 'Verify your email to help keep your account secure.'}{' '}
        {!message && (
          <button type="button" onClick={handleResend} disabled={isPending} className="font-semibold underline">
            {isPending ? 'Sending…' : 'Resend verification email'}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-warning/70 hover:text-warning"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
