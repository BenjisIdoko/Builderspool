import { redirect } from 'next/navigation';
import { FileTextIcon } from '@phosphor-icons/react/ssr';
import { getSellerActor } from '@/lib/seller/session';
import { getSellerProfile } from '@/lib/queries/sellerPortal';
import { prisma } from '@/lib/prisma';
import { kycStatusTone, pillClass } from '@/lib/statusColors';
import { Badge } from '@/components/ui/badge';
import { getSellerCoverage } from '@/lib/queries/areas';
import { ZoneCoverageForm } from '@/components/seller/zone-coverage-form';
import { CategoryRegistrationForm } from '@/components/seller/category-registration-form';
import { getSellerCategories } from '@/lib/queries/sheets';

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
  const actor = await getSellerActor();
  if (!actor) redirect('/seller/login');
  const sellerId = actor.sellerId;

  const profile = await getSellerProfile(sellerId);
  if (!profile) redirect('/seller/login');
  const [coverage, categories] = await Promise.all([getSellerCoverage(sellerId), getSellerCategories(sellerId)]);

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
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-[900px]">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · account</div>
      <h1 className="mb-1 text-heading-lg text-ink">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Business profile and verification status.</p>

      <div className="flex flex-col gap-4">
        <div className="rounded-card bg-card-alt p-6">
          <h2 className="mb-4 text-label text-muted-foreground uppercase">
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

        <div className="rounded-card bg-card-alt p-6">
          <h2 className="mb-1 text-label text-muted-foreground uppercase">Delivery zones you cover</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Tick the zones you can supply. You can bid in a zone only after BuildersPool approves it.
          </p>
          <ZoneCoverageForm zones={coverage.zones} nationalSupply={coverage.nationalSupply} canEdit={actor.isOwner} />
        </div>

        <div className="rounded-card bg-card-alt p-6">
          <h2 className="mb-1 text-label text-muted-foreground uppercase">Categories you bid for</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Tick the product categories you can supply. You receive requests for quotation (RFQs) only for categories BuildersPool has approved.
          </p>
          <CategoryRegistrationForm categories={categories} canEdit={actor.isOwner} />
        </div>

        <div className="rounded-card bg-card-alt p-6">
          <h2 className="mb-4 text-label text-muted-foreground uppercase">
            Verification documents
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

        <div className="rounded-card bg-card-alt p-6">
          <h2 className="mb-2 text-label text-muted-foreground uppercase">
            Notification preferences
          </h2>
          <p className="text-sm text-muted-foreground">
            Notification preferences aren&apos;t available yet. You still get in-app alerts for new demand
            pools and bid results; email and SMS alerts are planned.
          </p>
        </div>
      </div>
    </div>
  );
}
