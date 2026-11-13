'use client';

import { useState, useTransition } from 'react';
import { BankIcon, ClockIcon, EnvelopeSimpleIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import {
  cancelBankChangeAction,
  requestBankChangeAction,
  resendBankChangeCodeAction,
  verifyBankChangeCodeAction,
} from '@/app/seller/(dashboard)/kyc/bank-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type BankChangeView = {
  id: string;
  status: 'OTP_PENDING' | 'PENDING_REVIEW';
  newBankName: string;
  newAccountMasked: string;
  newAccountName: string;
  codesLeft: number;
};

type Result = { error: string } | { ok: true; message?: string };

function useRun() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  function run(action: (fd: FormData) => Promise<Result>, fd: FormData, onOk?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const r = await action(fd);
      if ('error' in r) setMessage({ tone: 'error', text: r.error });
      else {
        if (r.message) setMessage({ tone: 'ok', text: r.message });
        onOk?.();
      }
    });
  }
  return { pending, message, run };
}

function Message({ message }: { message: { tone: 'error' | 'ok'; text: string } | null }) {
  if (!message) return null;
  return (
    <p role={message.tone === 'error' ? 'alert' : 'status'} className={`text-pretty text-sm ${message.tone === 'error' ? 'text-danger' : 'text-success'}`}>
      {message.text}
    </p>
  );
}

function RequestDialog({ currentBank }: { currentBank: string | null }) {
  const [open, setOpen] = useState(false);
  const { pending, message, run } = useRun();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="max-sm:h-11">
          Change bank details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change your bank details</DialogTitle>
          <DialogDescription className="text-pretty">
            We email a 6-digit code to confirm it is you, then our team reviews the change and may call you on the number on file. Payouts are held while it is under review.
            {currentBank ? ` Your payouts go to ${currentBank} until then.` : ''}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(requestBankChangeAction, new FormData(e.currentTarget), () => setOpen(false));
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-bank">Bank</Label>
            <Input id="new-bank" name="bankName" required autoComplete="off" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-account">Account number</Label>
              <Input id="new-account" name="bankAccountNumber" required inputMode="numeric" pattern="\d{10}" autoComplete="off" />
              <p className="text-caption text-muted-foreground">10 digits.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-account-name">Account name</Label>
              <Input id="new-account-name" name="bankAccountName" required autoComplete="off" />
            </div>
          </div>
          <p className="text-pretty text-caption text-muted-foreground">The account name should match your registered business name.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Sending code…' : 'Send me a code'}
            </Button>
            <Message message={message} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// An approved seller's bank details, and the change in progress if there is one.
export function BankChangePanel({
  current,
  request,
  maskedEmail,
  lastRejection,
}: {
  current: { bankName: string | null; accountMasked: string; accountName: string | null };
  request: BankChangeView | null;
  maskedEmail: string;
  lastRejection: string | null;
}) {
  const { pending, message, run } = useRun();
  const [code, setCode] = useState('');
  const currentLabel = current.bankName ? `${current.bankName}, account ending ${current.accountMasked.slice(-4)}` : null;

  return (
    <section aria-labelledby="bank-heading" className="mb-6 rounded-lg bg-card-alt p-5 sm:p-6">
      <h2 id="bank-heading" className="mb-3 flex items-center gap-2 text-heading-sm text-ink">
        <BankIcon aria-hidden className="size-5" />
        Payout bank account
      </h2>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Bank</dt>
          <dd className="text-ink">{current.bankName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Account number</dt>
          <dd className="font-mono tabular-nums text-ink">{current.accountMasked}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Account name</dt>
          <dd className="break-words text-ink">{current.accountName ?? '—'}</dd>
        </div>
      </dl>

      {lastRejection && !request && (
        <p role="status" className="mt-4 flex items-start gap-2 text-pretty rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          <WarningIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Your last change was not approved: {lastRejection} Your payouts continue to the account above.</span>
        </p>
      )}

      {!request && (
        <div className="mt-4">
          <RequestDialog currentBank={currentLabel} />
        </div>
      )}

      {request?.status === 'OTP_PENDING' && (
        <div className="mt-4 space-y-3 rounded-md bg-surface p-4">
          <p className="flex items-start gap-2 text-pretty text-sm text-ink">
            <EnvelopeSimpleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              We emailed a 6-digit code to <strong>{maskedEmail}</strong>. It works for 10 minutes. You asked to change to {request.newBankName}, account {request.newAccountMasked}.
            </span>
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set('requestId', request.id);
              run(verifyBankChangeCodeAction, fd, () => setCode(''));
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="bank-code">Code</Label>
              <Input
                id="bank-code"
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                required
                maxLength={6}
                className="w-40 font-mono tracking-[0.3em] tabular-nums"
              />
            </div>
            <Button type="submit" disabled={pending || code.length !== 6} aria-busy={pending}>
              {pending ? 'Checking…' : 'Confirm code'}
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 max-sm:h-11"
              disabled={pending || request.codesLeft <= 0}
              onClick={() => {
                const fd = new FormData();
                fd.set('requestId', request.id);
                run(resendBankChangeCodeAction, fd);
              }}
            >
              Send a new code {request.codesLeft > 0 ? `(${request.codesLeft} left)` : ''}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="max-sm:h-11"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set('requestId', request.id);
                run(cancelBankChangeAction, fd);
              }}
            >
              Cancel this change
            </Button>
          </div>
          <Message message={message} />
        </div>
      )}

      {request?.status === 'PENDING_REVIEW' && (
        <div role="status" className="mt-4 space-y-2 rounded-md bg-warning-soft p-4 text-warning-text">
          <p className="flex items-start gap-2 text-pretty text-sm font-semibold">
            <ClockIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            Your change is under review
          </p>
          <p className="text-pretty text-sm">
            You asked to change to {request.newBankName}, account {request.newAccountMasked} ({request.newAccountName}). Our team is checking it and may call you on the number on file. Until it is
            approved, <strong>payouts are held</strong> and nothing is sent to either account.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="max-sm:h-11"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set('requestId', request.id);
              run(cancelBankChangeAction, fd);
            }}
          >
            Cancel this change
          </Button>
          <Message message={message} />
        </div>
      )}
    </section>
  );
}
