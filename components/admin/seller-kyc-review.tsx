'use client';

import { useState, useTransition } from 'react';
import { EyeIcon } from '@phosphor-icons/react/ssr';
import { approveKycAction, rejectKycAction } from '@/app/admin/(dashboard)/users/actions';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type SellerProfile = {
  userId: string;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  businessRegNumber: string | null;
  cacNumber: string | null;
  idType: string | null;
  idNumber: string | null;
  documentUrl: string | null;
  kycSubmittedAt: Date | null;
  kycRejectionReason: string | null;
};

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

export function SellerKycReview({ sellerName, profile }: { sellerName: string; profile: SellerProfile }) {
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

  if (profile.kycStatus === 'NOT_SUBMITTED') {
    return <Badge variant="outline" className={pillClass('neutral')}>Not submitted</Badge>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 hover:underline"
      >
        <Badge variant="outline" className={pillClass(kycStatusTone(profile.kycStatus))}>
          {profile.kycStatus === 'PENDING' ? 'Pending' : profile.kycStatus === 'APPROVED' ? 'Verified' : 'Rejected'}
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
          </div>
          {profile.documentUrl && (
            <a
              href={profile.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand hover:underline"
            >
              View submitted document →
            </a>
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
          ) : (
            profile.kycStatus === 'PENDING' && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRejectForm(true)} disabled={isPending}>
                  Reject
                </Button>
                <Button type="button" onClick={approve} disabled={isPending}>
                  {isPending ? 'Approving…' : 'Approve'}
                </Button>
              </DialogFooter>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
