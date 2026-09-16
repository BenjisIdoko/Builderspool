import { redirect } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, WarningIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { submitKyc } from './actions';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not started',
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

export default async function SellerKycPage() {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const profile = await getSellerProfile(sellerId);
  if (!profile) redirect('/seller/login');

  const editable = profile.kycStatus === 'NOT_SUBMITTED' || profile.kycStatus === 'REJECTED';

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Seller portal</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">KYC verification</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Required before payouts can be disbursed to your account. Document links only — no file upload
        yet, so use a link to something already hosted (Google Drive, a company site, etc.).
      </p>

      <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-border bg-surface p-4">
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
      </div>

      {editable ? (
        <form action={submitKyc} className="space-y-4 rounded-lg border border-border bg-surface p-6">
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
          </div>
          <div>
            <Label htmlFor="documentUrl" className="mb-1.5 text-xs text-muted-foreground">
              Document link (optional)
            </Label>
            <Input
              id="documentUrl"
              name="documentUrl"
              type="url"
              placeholder="https://…"
              defaultValue={profile.documentUrl ?? ''}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">{profile.kycStatus === 'REJECTED' ? 'Resubmit' : 'Submit for review'}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-6 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Business registration number</div>
              <div className="text-ink">{profile.businessRegNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">CAC number</div>
              <div className="text-ink">{profile.cacNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ID type</div>
              <div className="text-ink">{profile.idType}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ID number</div>
              <div className="text-ink">{profile.idNumber}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
