import { redirect } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { getSellerActor } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { acceptCurrentTermsAction } from './actions';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { lagosYmd } from '@/lib/bidding/schedule';
import { describeExpiry, documentExpiryState } from '@/lib/kyc/expiry';
import { isKycUploadConfigured } from '@/lib/storage/kycDocuments';
import { KycForm } from '@/components/seller/kyc-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KYC_LABEL } from '@/lib/labels';
import { ActionForm } from '@/components/ui/action-form';

const DATE = { dateStyle: 'medium', timeZone: 'Africa/Lagos' } as const;

function Detail({ label, children, note }: { label: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-ink">{children}</dd>
      {note && <dd className="mt-1 text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

export default async function SellerKycPage() {
  const todayYmd = lagosYmd(new Date());
  const actor = await getSellerActor();
  if (!actor) redirect('/seller/login');

  const profile = await getSellerProfile(actor.sellerId);
  if (!profile) redirect('/seller/login');

  const uploadEnabled = isKycUploadConfigured();
  // Only the owner can change what the business declares; staff see it read-only.
  const editable = actor.isOwner && (profile.kycStatus === 'NOT_SUBMITTED' || profile.kycStatus === 'REJECTED');

  const [settings, acceptedTerms] = await Promise.all([
    getSettings(),
    prisma.sellerTermsAcceptance.findFirst({ where: { sellerUserId: actor.sellerId }, orderBy: { acceptedAt: 'desc' } }),
  ]);
  const termsVersion = String(settings['accounts.termsVersion']);
  const termsOutdated = !!acceptedTerms && acceptedTerms.version !== termsVersion;
  // A seller an admin approved without a KYC submission (a legacy or seeded
  // account) has no acceptance on record, so it never saw the banner below.
  // Sellers still at NOT_SUBMITTED accept through the checkbox on the form.
  const termsMissing = !acceptedTerms && profile.kycStatus !== 'NOT_SUBMITTED';
  const expiry = documentExpiryState(profile.documentExpiresAt, Number(settings['accounts.documentExpiryWarnDays']));

  const submitted = profile.kycStatus !== 'NOT_SUBMITTED';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-2xl">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · verification</div>
      <h1 className="mb-1 text-heading-lg text-ink">KYC verification</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        We verify every seller before they can be paid. Fill in your business details and our team will review them.
      </p>

      <div role="status" className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-card-alt p-4">
        <Badge variant="outline" className={pillClass(kycStatusTone(profile.kycStatus))}>
          {KYC_LABEL[profile.kycStatus] ?? profile.kycStatus}
        </Badge>
        {profile.kycStatus === 'NOT_SUBMITTED' && (
          <span className="text-pretty text-sm text-muted-foreground">
            {actor.isOwner ? 'Nothing submitted yet. Fill in the form below.' : 'Only the account owner can submit these details.'}
          </span>
        )}
        {profile.kycStatus === 'PENDING' && (
          <span className="flex items-center gap-1.5 text-pretty text-sm text-muted-foreground">
            <ClockIcon aria-hidden className="size-4 shrink-0" />
            Submitted {profile.kycSubmittedAt?.toLocaleDateString('en-NG', DATE)}. Our team hasn&apos;t reviewed it yet.
          </span>
        )}
        {profile.kycStatus === 'APPROVED' && (
          <span className="flex items-center gap-1.5 text-pretty text-sm text-muted-foreground">
            <CheckCircleIcon aria-hidden className="size-4 shrink-0 text-success" />
            Verified on {profile.kycReviewedAt?.toLocaleDateString('en-NG', DATE)}.
          </span>
        )}
        {profile.kycStatus === 'REJECTED' && (
          <span className="flex items-start gap-1.5 text-pretty text-sm text-danger">
            <WarningIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            {profile.kycRejectionReason ?? 'Your details were not accepted.'} Fix them below and resubmit.
          </span>
        )}
        {profile.kycStatus === 'SUSPENDED' && (
          <span className="flex items-start gap-1.5 text-pretty text-sm text-danger">
            <WarningIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            Your account is paused, so you can&apos;t bid until BuildersPool reactivates it.
            {profile.suspensionReason ? ` Reason: ${profile.suspensionReason}` : ''}
          </span>
        )}
      </div>

      {expiry && expiry.state !== 'ok' && (
        <p
          role="alert"
          className={`mb-6 text-pretty rounded-lg px-4 py-3 text-sm ${
            expiry.state === 'expired' ? 'bg-danger/10 text-danger' : 'bg-warning-soft text-warning-text'
          }`}
        >
          Your supporting document: {describeExpiry(expiry)}. Upload a current one and resubmit to avoid interruption.
        </p>
      )}

      {(termsOutdated || termsMissing) && actor.isOwner && (
        <ActionForm action={acceptCurrentTermsAction} className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning-text">
          <span className="min-w-0 flex-1 basis-56 text-pretty">
            {termsMissing
              ? `You haven't accepted the seller terms (version ${termsVersion}) yet. Please review and accept them.`
              : `The seller terms have been updated to version ${termsVersion}. Please review and accept them.`}
          </span>
          <Button type="submit" size="sm" className="max-sm:h-11">
            Accept terms {termsVersion}
          </Button>
        </ActionForm>
      )}

      {editable ? (
        <KycForm
          values={{
            businessRegNumber: profile.businessRegNumber ?? '',
            cacNumber: profile.cacNumber ?? '',
            idType: profile.idType ?? '',
            idNumber: profile.idNumber ?? '',
            tin: profile.tin ?? '',
            businessAddress: profile.businessAddress ?? '',
            bankName: profile.bankName ?? '',
            bankAccountNumber: profile.bankAccountNumber ?? '',
            bankAccountName: profile.bankAccountName ?? '',
            documentExpiresAt: profile.documentExpiresAt ? profile.documentExpiresAt.toISOString().slice(0, 10) : '',
          }}
          cac={{
            verifiedName: profile.cacVerifiedAt ? profile.cacVerifiedCompanyName : null,
            entityType: profile.cacVerifiedEntityType,
            status: profile.cacVerifiedStatus,
            error: profile.cacVerificationError,
          }}
          documentOnFile={profile.documentName || profile.documentUrl ? (profile.documentName ?? 'a previously submitted link') : null}
          uploadEnabled={uploadEnabled}
          termsVersion={termsVersion}
          todayYmd={todayYmd}
          resubmitting={profile.kycStatus === 'REJECTED'}
        />
      ) : (
        submitted && (
          <section aria-labelledby="kyc-details-heading" className="rounded-lg bg-card-alt p-5 sm:p-6">
            <h2 id="kyc-details-heading" className="mb-4 text-heading-sm text-ink">
              Your details
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Business registration number">{profile.businessRegNumber ?? '—'}</Detail>
              <Detail
                label="CAC number"
                note={
                  profile.cacVerifiedAt && profile.cacVerifiedCompanyName ? (
                    <span className="flex items-center gap-1.5 text-success">
                      <CheckCircleIcon aria-hidden className="size-3.5 shrink-0" />
                      Verified: {profile.cacVerifiedCompanyName}
                    </span>
                  ) : undefined
                }
              >
                {profile.cacNumber ?? '—'}
              </Detail>
              <Detail label="ID type">{profile.idType ?? '—'}</Detail>
              <Detail label="ID number">{profile.idNumber ?? '—'}</Detail>
              <Detail label="TIN">{profile.tin ?? '—'}</Detail>
              <Detail label="Business address">{profile.businessAddress ?? '—'}</Detail>
              <Detail label="Bank account" note={profile.bankAccountName}>
                {profile.bankName ? `${profile.bankName} · ${profile.bankAccountNumber ?? ''}` : '—'}
              </Detail>
              <Detail label="Seller terms">{acceptedTerms ? `Version ${acceptedTerms.version} accepted` : 'Not yet accepted'}</Detail>
              {(profile.documentName || profile.documentUrl) && (
                <Detail label="Supporting document" note={expiry ? describeExpiry(expiry) : undefined}>
                  {profile.documentName ?? 'Link submitted'}
                </Detail>
              )}
            </dl>
          </section>
        )
      )}
    </div>
  );
}
