import { redirect } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { getSellerActor } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { submitKyc, verifyCacAction, acceptCurrentTermsAction } from './actions';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma';
import { describeExpiry, documentExpiryState } from '@/lib/kyc/expiry';
import { isKycUploadConfigured } from '@/lib/storage/kycDocuments';
import { KycDocumentInput } from '@/components/seller/kyc-document-input';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not started',
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

export default async function SellerKycPage() {
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
  const expiry = documentExpiryState(profile.documentExpiresAt, Number(settings['accounts.documentExpiryWarnDays']));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Seller portal</div>
      <h1 className="mb-1 text-heading-lg text-ink">KYC verification</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Required before payouts can be disbursed to your account. Where available, attach a supporting
        document (a CAC certificate or your ID) as a PDF, JPEG or PNG up to 4 MB.
      </p>

      <div className="mb-6 flex items-center gap-2.5 rounded-lg bg-card-alt p-4">
        <Badge variant="outline" className={pillClass(kycStatusTone(profile.kycStatus))}>
          {KYC_LABEL[profile.kycStatus]}
        </Badge>
        {profile.kycStatus === 'PENDING' && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="size-4" />
            Submitted {profile.kycSubmittedAt?.toLocaleDateString('en-NG', { dateStyle: 'medium' })} — an admin
            hasn&apos;t reviewed it yet.
          </span>
        )}
        {profile.kycStatus === 'APPROVED' && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircleIcon className="size-4 text-success" />
            Verified {profile.kycReviewedAt?.toLocaleDateString('en-NG', { dateStyle: 'medium' })}.
          </span>
        )}
        {profile.kycStatus === 'REJECTED' && profile.kycRejectionReason && (
          <span className="flex items-center gap-1.5 text-sm text-danger">
            <WarningIcon className="size-4" />
            {profile.kycRejectionReason}
          </span>
        )}
        {profile.kycStatus === 'SUSPENDED' && (
          <span className="flex items-center gap-1.5 text-sm text-danger">
            <WarningIcon className="size-4" />
            Your account is paused — you can&apos;t bid until BuildersPool reactivates it.
            {profile.suspensionReason ? ` Reason: ${profile.suspensionReason}` : ''}
          </span>
        )}
      </div>

      {expiry && expiry.state !== 'ok' && (
        <p
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            expiry.state === 'expired' ? 'bg-danger/10 text-danger' : 'bg-warning-soft text-warning-text'
          }`}
        >
          Your supporting document: {describeExpiry(expiry)}. Upload a current one and resubmit to avoid interruption.
        </p>
      )}

      {termsOutdated && actor.isOwner && (
        <form action={acceptCurrentTermsAction} className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning-text">
          <span>The seller terms have been updated to {termsVersion}. Please review and accept them.</span>
          <Button type="submit" size="sm">
            Accept terms {termsVersion}
          </Button>
        </form>
      )}

      {editable ? (
        <form action={submitKyc} className="space-y-4 rounded-lg bg-card-alt p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="businessRegNumber" className="mb-1.5 text-xs text-muted-foreground">
                Business registration number
              </Label>
              <Input
                id="businessRegNumber"
                name="businessRegNumber"
                required
                defaultValue={profile.businessRegNumber ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="cacNumber" className="mb-1.5 text-xs text-muted-foreground">
                CAC number
              </Label>
              <Input id="cacNumber" name="cacNumber" required defaultValue={profile.cacNumber ?? ''} />
            </div>
            <div>
              <Label htmlFor="idType" className="mb-1.5 text-xs text-muted-foreground">
                ID type
              </Label>
              <select
                id="idType"
                name="idType"
                required
                defaultValue={profile.idType ?? ''}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>
                  Select an ID type
                </option>
                <option value="NIN">NIN</option>
                <option value="International passport">International passport</option>
                <option value="Driver's licence">Driver&apos;s licence</option>
              </select>
            </div>
            <div>
              <Label htmlFor="idNumber" className="mb-1.5 text-xs text-muted-foreground">
                ID number
              </Label>
              <Input id="idNumber" name="idNumber" required defaultValue={profile.idNumber ?? ''} />
            </div>
            <div>
              <Label htmlFor="tin" className="mb-1.5 text-xs text-muted-foreground">
                Tax identification number (TIN)
              </Label>
              <Input id="tin" name="tin" required defaultValue={profile.tin ?? ''} />
            </div>
            <div>
              <Label htmlFor="businessAddress" className="mb-1.5 text-xs text-muted-foreground">
                Business address
              </Label>
              <Input id="businessAddress" name="businessAddress" required defaultValue={profile.businessAddress ?? ''} />
            </div>
          </div>

          <fieldset className="space-y-4 rounded-md border border-border p-4">
            <legend className="px-1 text-xs font-semibold text-slate">Bank account for payouts</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="bankName" className="mb-1.5 text-xs text-muted-foreground">
                  Bank
                </Label>
                <Input id="bankName" name="bankName" required defaultValue={profile.bankName ?? ''} />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber" className="mb-1.5 text-xs text-muted-foreground">
                  Account number (10 digits)
                </Label>
                <Input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  required
                  inputMode="numeric"
                  pattern="\d{10}"
                  defaultValue={profile.bankAccountNumber ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="bankAccountName" className="mb-1.5 text-xs text-muted-foreground">
                  Account name
                </Label>
                <Input id="bankAccountName" name="bankAccountName" required defaultValue={profile.bankAccountName ?? ''} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The account name should match your registered business name. Only the owner can change bank details.
            </p>
          </fieldset>

          <div className="flex flex-col gap-2.5 rounded-md border border-border bg-well/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Checks the CAC number above against the real Corporate Affairs Commission registry.
              {profile.cacVerifiedAt && profile.cacVerifiedCompanyName && (
                <p className="mt-1 flex items-center gap-1.5 text-success">
                  <CheckCircleIcon className="size-3.5 shrink-0" />
                  Verified — {profile.cacVerifiedCompanyName} ({profile.cacVerifiedEntityType},{' '}
                  {profile.cacVerifiedStatus}).
                </p>
              )}
              {profile.cacVerificationError && (
                <p className="mt-1 flex items-center gap-1.5 text-danger">
                  <WarningIcon className="size-3.5 shrink-0" />
                  {profile.cacVerificationError}
                </p>
              )}
            </div>
            <Button type="submit" formAction={verifyCacAction} formNoValidate variant="outline" className="shrink-0">
              Verify CAC number
            </Button>
          </div>

          {uploadEnabled ? (
            <div>
              <Label htmlFor="document" className="mb-1.5 text-xs text-muted-foreground">
                Supporting document (PDF, JPEG or PNG, up to 4 MB)
              </Label>
              <KycDocumentInput />
              {(profile.documentName || profile.documentUrl) && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  On file: {profile.documentName ?? 'a previously submitted link'}. Choose a new file only to replace it.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {profile.documentName || profile.documentUrl
                ? `On file: ${profile.documentName ?? 'a previously submitted link'}. `
                : ''}
              Document upload isn&apos;t available yet — you can submit without one and our team will follow up.
            </p>
          )}

          <div>
            <Label htmlFor="documentExpiresAt" className="mb-1.5 text-xs text-muted-foreground">
              Document expiry date (if it has one, e.g. a SON certificate)
            </Label>
            <Input
              id="documentExpiresAt"
              name="documentExpiresAt"
              type="date"
              defaultValue={profile.documentExpiresAt ? profile.documentExpiresAt.toISOString().slice(0, 10) : ''}
            />
          </div>

          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" name="termsAccepted" required className="mt-0.5 size-4 accent-[var(--color-brand)]" />
            <span>
              I accept the BuildersPool seller terms (version {termsVersion}) on behalf of this business.
              <span className="block text-xs text-muted-foreground">The full terms text will be published before the pilot.</span>
            </span>
          </label>

          <div className="flex justify-end">
            <Button type="submit">{profile.kycStatus === 'REJECTED' ? 'Resubmit' : 'Submit for review'}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 rounded-lg bg-card-alt p-6 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Business registration number</div>
              <div className="text-ink">{profile.businessRegNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CAC number</div>
              <div className="text-ink">{profile.cacNumber}</div>
              {profile.cacVerifiedAt && profile.cacVerifiedCompanyName && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-success">
                  <CheckCircleIcon className="size-3.5 shrink-0" />
                  Verified — {profile.cacVerifiedCompanyName}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ID type</div>
              <div className="text-ink">{profile.idType}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ID number</div>
              <div className="text-ink">{profile.idNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">TIN</div>
              <div className="text-ink">{profile.tin ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Business address</div>
              <div className="text-ink">{profile.businessAddress ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Bank account</div>
              <div className="text-ink">
                {profile.bankName ? `${profile.bankName} · ${profile.bankAccountNumber ?? ''}` : '—'}
              </div>
              {profile.bankAccountName && <div className="text-xs text-muted-foreground">{profile.bankAccountName}</div>}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Seller terms</div>
              <div className="text-ink">{acceptedTerms ? `${acceptedTerms.version} accepted` : 'Not yet accepted'}</div>
            </div>
            {(profile.documentName || profile.documentUrl) && (
              <div>
                <div className="text-xs text-muted-foreground">Supporting document</div>
                <div className="text-ink">{profile.documentName ?? 'Link submitted'}</div>
                {expiry && <div className="text-xs text-muted-foreground">{describeExpiry(expiry)}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
