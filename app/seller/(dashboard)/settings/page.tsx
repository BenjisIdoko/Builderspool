import { redirect } from 'next/navigation';
import { FileTextIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { prisma } from '@/lib/prisma';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'Not started',
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

export default async function SellerSettingsPage() {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');

  const profile = await getSellerProfile(sellerId);
  if (!profile) redirect('/seller/login');

  // Real, derived from actual bid history — not a stored field, so it's
  // computed the same honest way AdminSellers' directory derives it.
  const bids = await prisma.bid.findMany({
    where: { sellerId },
    select: { material: { select: { category: true } } },
  });
  const categoryCounts = new Map<string, number>();
  for (const b of bids) categoryCounts.set(b.material.category, (categoryCounts.get(b.material.category) ?? 0) + 1);
  const primaryCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No bids submitted yet';

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · account</div>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Business profile and verification status.</p>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
            Business profile
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business name" value={profile.user.businessName ?? profile.user.name} />
            <Field label="Business registration number" value={profile.businessRegNumber ?? 'Not on file'} />
            <Field label="Location" value={profile.user.location ?? 'Not on file'} />
            <Field label="Primary category" value={primaryCategory} />
            <Field label="Regions served" value={profile.regionsServed.join(', ') || 'None set'} />
            <Field label="Contact email" value={profile.user.email} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
            Verification
          </h2>
          <div className="flex items-center justify-between border-b border-border py-2.5">
            <div className="flex items-center gap-2.5">
              <FileTextIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-ink">CAC / business registration</span>
            </div>
            <Badge variant="outline" className={pillClass(kycStatusTone(profile.kycStatus))}>
              {KYC_LABEL[profile.kycStatus]}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            One combined verification status today, not separate per-document tracking. Manage or
            resubmit on the{' '}
            <a href="/seller/kyc" className="font-semibold text-brand hover:underline">
              KYC verification
            </a>{' '}
            page.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
            Notification preferences
          </h2>
          <p className="text-sm text-muted-foreground">
            Not available yet — this app doesn&apos;t have per-account notification preferences today.
            In-app alerts (new demand pools, bid results) already work; email/SMS opt-in is planned but
            not built.
          </p>
        </div>
      </div>
    </div>
  );
}
