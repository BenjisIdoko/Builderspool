import Link from 'next/link';
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
  SUSPENDED: 'Suspended',
};

const KYC_ACTION: Record<string, string> = {
  NOT_SUBMITTED: 'Start verification',
  PENDING: 'View your submission',
  APPROVED: 'View your details',
  REJECTED: 'Resubmit your documents',
  SUSPENDED: 'View your details',
};

const CARD = 'rounded-card bg-card-alt p-5 shadow-[0_0_0_1px_var(--color-hairline)] sm:p-6';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-bold text-ink">{value}</dd>
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
  const primaryCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No bids yet';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-[900px]">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · account</div>
      <h1 className="mb-1 text-heading-lg text-ink">Settings</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Your business details, where you deliver, and which categories you sell in.
      </p>

      <div className="flex flex-col gap-4">
        <section aria-labelledby="profile-heading" className={CARD}>
          <h2 id="profile-heading" className="mb-4 text-heading-sm text-ink">
            Business profile
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Business name" value={profile.user.businessName ?? profile.user.name} />
            <Field label="Business registration number" value={profile.businessRegNumber ?? 'Not on file'} />
            <Field label="Location" value={profile.user.location ?? 'Not on file'} />
            <Field label="Category you bid in most" value={primaryCategory} />
            <Field label="Regions served" value={profile.regionsServed.join(', ') || 'None set'} />
            <Field label="Contact email" value={profile.user.email} />
          </dl>
        </section>

        <section aria-labelledby="zones-heading" className={CARD}>
          <h2 id="zones-heading" className="mb-1 text-heading-sm text-ink">
            Delivery zones you cover
          </h2>
          <p className="mb-4 max-w-[64ch] text-pretty text-sm text-muted-foreground">
            Tick the zones you can supply. You can bid in a zone once BuildersPool approves it.
          </p>
          <ZoneCoverageForm zones={coverage.zones} nationalSupply={coverage.nationalSupply} canEdit={actor.isOwner} />
        </section>

        <section aria-labelledby="categories-heading" className={CARD}>
          <h2 id="categories-heading" className="mb-1 text-heading-sm text-ink">
            Categories you sell in
          </h2>
          <p className="mb-4 max-w-[64ch] text-pretty text-sm text-muted-foreground">
            Tick the product categories you can supply. You get requests for quotation (RFQs) only for categories BuildersPool has approved.
          </p>
          <CategoryRegistrationForm categories={categories} canEdit={actor.isOwner} />
        </section>

        <section aria-labelledby="verification-heading" className={CARD}>
          <h2 id="verification-heading" className="mb-3 text-heading-sm text-ink">
            Verification
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <FileTextIcon aria-hidden className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-ink">CAC / business registration</span>
            </div>
            <Badge variant="outline" className={pillClass(kycStatusTone(profile.kycStatus))}>
              {KYC_LABEL[profile.kycStatus] ?? profile.kycStatus}
            </Badge>
          </div>
          <p className="mt-3 max-w-[64ch] text-pretty text-sm text-muted-foreground">
            We review your documents together, so there is one status for all of them.{' '}
            <Link href="/seller/kyc" className="rounded-sm font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              {KYC_ACTION[profile.kycStatus] ?? 'Open verification'}
            </Link>
          </p>
        </section>

        <section aria-labelledby="notifications-heading" className={CARD}>
          <h2 id="notifications-heading" className="mb-2 text-heading-sm text-ink">
            Notifications
          </h2>
          <p className="max-w-[64ch] text-pretty text-sm text-muted-foreground">
            You get in-app alerts for new pools and bid results. Email and SMS alerts are coming soon.
          </p>
        </section>
      </div>
    </div>
  );
}
