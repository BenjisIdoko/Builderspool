'use client';

import { useState, useTransition } from 'react';
import { EyeIcon, CheckCircleIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import {
  approveKycAction,
  rejectKycAction,
  suspendSellerAction,
  reactivateSellerAction,
} from '@/app/admin/(dashboard)/users/actions';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { compareBusinessNames } from '@/lib/kyc/nameMatch';
import { describeExpiry, documentExpiryState } from '@/lib/kyc/expiry';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type SellerProfile = {
  userId: string;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  tin: string | null;
  businessAddress: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankNameMatch: string | null;
  documentExpiresAt: Date | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  businessRegNumber: string | null;
  cacNumber: string | null;
  idType: string | null;
  idNumber: string | null;
  documentUrl: string | null;
  documentPath: string | null;
  documentName: string | null;
  kycSubmittedAt: Date | null;
  kycRejectionReason: string | null;
  cacVerifiedAt: Date | null;
  cacVerifiedCompanyName: string | null;
  cacVerifiedStatus: string | null;
  cacVerifiedEntityType: string | null;
  cacVerificationError: string | null;
};

// Defence in depth for rows saved before the server validated the scheme.
function isWebUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

export function SellerKycReview({
  sellerName,
  accountBusinessName,
  profile,
  termsAccepted,
  currentTermsVersion,
  expiryWarnDays,
}: {
  sellerName: string;
  accountBusinessName: string | null;
  profile: SellerProfile;
  termsAccepted: { version: string; at: Date } | null;
  currentTermsVersion: string;
  expiryWarnDays: number;
}) {
  const expiry = documentExpiryState(profile.documentExpiresAt, expiryWarnDays);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const nameMatch =
    accountBusinessName && profile.cacVerifiedCompanyName
      ? compareBusinessNames(accountBusinessName, profile.cacVerifiedCompanyName)
      : null;
  const [open, setOpen] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    const formData = new FormData();
    formData.set('userId', profile.userId);
    startTransition(async () => {
      try {
        await approveKycAction(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not approve.');
      }
    });
  }

  function reject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('userId', profile.userId);
    startTransition(async () => {
      try {
        await rejectKycAction(formData);
        setOpen(false);
        setShowRejectForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reject.');
      }
    });
  }

  function suspend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('userId', profile.userId);
    startTransition(async () => {
      try {
        await suspendSellerAction(formData);
        setOpen(false);
        setShowSuspendForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not suspend.');
      }
    });
  }

  function reactivate() {
    setError(null);
    const formData = new FormData();
    formData.set('userId', profile.userId);
    startTransition(async () => {
      try {
        await reactivateSellerAction(formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reactivate.');
      }
    });
  }

  if (profile.kycStatus === 'NOT_SUBMITTED') {
    return <Badge variant="outline" className={pillClass('neutral')}>Not submitted</Badge>;
  }

  const bankMatchTone =
    profile.bankNameMatch === 'MATCH'
      ? 'bg-success-soft text-success'
      : profile.bankNameMatch === 'PARTIAL'
        ? 'bg-warning-soft text-warning-text'
        : 'bg-danger/10 text-danger';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 hover:underline"
      >
        <Badge variant="outline" className={pillClass(kycStatusTone(profile.kycStatus))}>
          {profile.kycStatus === 'PENDING'
            ? 'Pending'
            : profile.kycStatus === 'APPROVED'
              ? 'Verified'
              : profile.kycStatus === 'SUSPENDED'
                ? 'Suspended'
                : 'Rejected'}
        </Badge>
        <EyeIcon className="size-3.5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sellerName} — KYC submission</DialogTitle>
            <DialogDescription>
              Submitted {profile.kycSubmittedAt?.toLocaleDateString('en-NG', { dateStyle: 'medium' })}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Business reg. number" value={profile.businessRegNumber} />
            <Field label="CAC number" value={profile.cacNumber} />
            <Field label="ID type" value={profile.idType} />
            <Field label="ID number" value={profile.idNumber} />
            <Field label="TIN" value={profile.tin} />
            <Field label="Business address" value={profile.businessAddress} />
            <Field label="Bank" value={profile.bankName} />
            <Field label="Account number" value={profile.bankAccountNumber} />
            <Field label="Account name" value={profile.bankAccountName} />
          </div>

          {profile.bankNameMatch && (
            <p className={`rounded-md px-2.5 py-2 text-xs ${bankMatchTone}`}>
              {profile.bankNameMatch === 'MATCH'
                ? 'Bank account name matches the business.'
                : profile.bankNameMatch === 'PARTIAL'
                  ? 'Bank account name only partly matches the business — worth a look.'
                  : 'Bank account name does not match the business — confirm the account belongs to the seller.'}
            </p>
          )}

          <div className="space-y-1 text-xs text-muted-foreground">
            {expiry && (
              <p className={expiry.state === 'expired' ? 'text-danger' : expiry.state === 'soon' ? 'text-warning-text' : ''}>
                Supporting document: {describeExpiry(expiry)} ({profile.documentExpiresAt?.toLocaleDateString('en-NG', { dateStyle: 'medium' })}).
              </p>
            )}
            <p className={termsAccepted?.version === currentTermsVersion ? '' : 'text-warning-text'}>
              {termsAccepted
                ? `Seller terms ${termsAccepted.version} accepted ${termsAccepted.at.toLocaleDateString('en-NG', { dateStyle: 'medium' })}${termsAccepted.version === currentTermsVersion ? '.' : ` — current version is ${currentTermsVersion}.`}`
                : 'Seller terms not yet accepted.'}
            </p>
            {profile.kycStatus === 'SUSPENDED' && (
              <p className="text-danger">
                Suspended {profile.suspendedAt?.toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                {profile.suspensionReason ? ` — ${profile.suspensionReason}` : ''}.
              </p>
            )}
          </div>

          {profile.cacVerifiedAt && profile.cacVerifiedCompanyName ? (
            <p className="flex items-start gap-1.5 text-xs text-success">
              <CheckCircleIcon className="size-3.5 shrink-0 translate-y-0.5" />
              CAC verified against the registry — {profile.cacVerifiedCompanyName} (
              {profile.cacVerifiedEntityType}, {profile.cacVerifiedStatus}) on{' '}
              {profile.cacVerifiedAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })}.
            </p>
          ) : profile.cacVerificationError ? (
            <p className="flex items-start gap-1.5 text-xs text-danger">
              <WarningIcon className="size-3.5 shrink-0 translate-y-0.5" />
              CAC verification failed: {profile.cacVerificationError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">CAC number not yet verified against the registry.</p>
          )}
          {nameMatch && profile.cacVerifiedAt ? (
            <p
              className={`rounded-md px-2.5 py-2 text-xs ${
                nameMatch === 'MATCH'
                  ? 'bg-success-soft text-success'
                  : nameMatch === 'PARTIAL'
                    ? 'bg-warning-soft text-warning-text'
                    : 'bg-danger/10 text-danger'
              }`}
            >
              {nameMatch === 'MATCH'
                ? 'Registered name matches the account business name.'
                : nameMatch === 'PARTIAL'
                  ? 'Registered name only partly matches the account business name — worth a look.'
                  : 'Registered name does not match the account business name — confirm this is the seller\'s own registration.'}{' '}
              Account: &ldquo;{accountBusinessName}&rdquo; · Registry: &ldquo;{profile.cacVerifiedCompanyName}&rdquo;
            </p>
          ) : null}

          {profile.documentPath ? (
            <a
              href={`/admin/verification/document/${profile.userId}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand hover:underline"
            >
              View {profile.documentName ?? 'submitted document'} →
            </a>
          ) : (
            profile.documentUrl &&
            isWebUrl(profile.documentUrl) && (
              <a
                href={profile.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand hover:underline"
              >
                View submitted link →
              </a>
            )
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          {showRejectForm ? (
            <form onSubmit={reject} className="space-y-3">
              <div>
                <Label htmlFor="reason" className="mb-1.5 text-xs text-muted-foreground">
                  Reason for rejecting
                </Label>
                <Textarea id="reason" name="reason" required placeholder="What needs to be corrected?" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRejectForm(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isPending}>
                  {isPending ? 'Rejecting…' : 'Reject'}
                </Button>
              </DialogFooter>
            </form>
          ) : showSuspendForm ? (
            <form onSubmit={suspend} className="space-y-3">
              <div>
                <Label htmlFor="suspend-reason" className="mb-1.5 text-xs text-muted-foreground">
                  Reason for suspending
                </Label>
                <Textarea id="suspend-reason" name="reason" required placeholder="Why is this seller being paused?" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSuspendForm(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isPending}>
                  {isPending ? 'Suspending…' : 'Suspend seller'}
                </Button>
              </DialogFooter>
            </form>
          ) : profile.kycStatus === 'PENDING' ? (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRejectForm(true)} disabled={isPending}>
                Reject
              </Button>
              <Button type="button" onClick={approve} disabled={isPending}>
                {isPending ? 'Approving…' : 'Approve'}
              </Button>
            </DialogFooter>
          ) : profile.kycStatus === 'APPROVED' ? (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSuspendForm(true)} disabled={isPending}>
                Suspend seller
              </Button>
            </DialogFooter>
          ) : profile.kycStatus === 'SUSPENDED' ? (
            <DialogFooter>
              <Button type="button" onClick={reactivate} disabled={isPending}>
                {isPending ? 'Reactivating…' : 'Reactivate seller'}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
