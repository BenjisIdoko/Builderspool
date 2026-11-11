'use client';

import { useId, useState } from 'react';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';

// Shows a one-time invite link with a copy button. The link lets the staff
// member choose their own password; it is shown here once and is not stored
// in readable form, so if it is lost the owner issues a new one.
export function InviteLinkPanel({ name, inviteUrl, onDismiss }: { name: string; inviteUrl: string; onDismiss?: () => void }) {
  const [copied, setCopied] = useState(false);
  const inputId = useId();

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be refused in some browsers; select the text instead.
      (document.getElementById(inputId) as HTMLInputElement | null)?.select();
    }
  }

  return (
    <div className="rounded-card border-l-4 border-cyan bg-pale-blue p-4" role="status">
      <p className="text-heading-sm text-ink">Invite link for {name}</p>
      <p className="mt-1 max-w-[64ch] text-pretty text-body-sm text-ink">
        Send this link to {name} privately, for example on WhatsApp. They open it and choose their own password. It works
        once and expires in 72 hours. We can&apos;t show it again, so copy it now.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 min-w-0 flex-1 rounded-md border border-input bg-surface px-3 font-mono text-caption no-zoom text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Invite link for ${name}`}
        />
        <Button type="button" variant="outline" onClick={copy} className="shrink-0 gap-1.5">
          {copied ? <CheckIcon aria-hidden className="size-4" /> : <CopyIcon aria-hidden className="size-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="mt-2 inline-flex min-h-11 items-center rounded-sm text-body-sm font-medium text-cyan-text underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          I&apos;ve copied it
        </button>
      )}
    </div>
  );
}
