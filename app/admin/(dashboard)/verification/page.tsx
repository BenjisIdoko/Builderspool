import Link from 'next/link';
import { ShieldCheckIcon, ClockIcon, XCircleIcon, IdentificationCardIcon } from '@phosphor-icons/react/ssr';
import { getSellersForVerification } from '@/lib/queries/adminVerification';
import { SellerKycReview } from '@/components/admin/seller-kyc-review';
import { Avatar } from '@/components/avatar';
import { KpiCard } from '@/components/kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { KycStatus } from '@prisma/client';

const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED'] as const;

const STATUS_LABEL: Record<KycStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  NOT_SUBMITTED: 'Not submitted',
};

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus = status && (STATUS_FILTERS as readonly string[]).includes(status) ? (status as KycStatus) : undefined;

  const allSellers = await getSellersForVerification();
  const sellers = validStatus ? allSellers.filter((s) => s.sellerProfile!.kycStatus === validStatus) : allSellers;
  const pendingCount = allSellers.filter((s) => s.sellerProfile!.kycStatus === 'PENDING').length;

  const kpiCards = [
    {
      label: 'Pending review',
      value: String(pendingCount),
      icon: ClockIcon,
      tone: pendingCount > 0 ? ('warning' as const) : ('success' as const),
      chip: pendingCount > 0 ? 'Needs action' : 'All clear',
    },
    {
      label: 'Verified',
      value: String(allSellers.filter((s) => s.sellerProfile!.kycStatus === 'APPROVED').length),
      icon: ShieldCheckIcon,
      tone: 'success' as const,
      chip: 'Eligible to bid',
    },
    {
      label: 'Rejected',
      value: String(allSellers.filter((s) => s.sellerProfile!.kycStatus === 'REJECTED').length),
      icon: XCircleIcon,
      tone: 'danger' as const,
      chip: 'Needs resubmission',
    },
    {
      label: 'Not submitted',
      value: String(allSellers.filter((s) => s.sellerProfile!.kycStatus === 'NOT_SUBMITTED').length),
      icon: IdentificationCardIcon,
      tone: 'neutral' as const,
      chip: 'No submission yet',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · ops desk</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Vendor verification</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every seller&apos;s real KYC submission, reviewed here instead of buried in the general user
        directory — sellers still awaiting review are listed first.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1">
        <Link href="/admin/verification">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              !validStatus ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
            }`}
          >
            All ({allSellers.length})
          </span>
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={`/admin/verification?status=${s}`}>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                validStatus === s ? 'bg-ink text-canvas' : 'text-slate hover:bg-well hover:text-ink'
              }`}
            >
              {STATUS_LABEL[s]} ({allSellers.filter((sel) => sel.sellerProfile!.kycStatus === s).length})
            </span>
          </Link>
        ))}
      </div>

      {sellers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <ShieldCheckIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No sellers match this filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Regions served</TableHead>
                <TableHead>Trust score</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>KYC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => {
                const profile = seller.sellerProfile!;
                return (
                  <TableRow key={seller.id}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={seller.name} className="size-8 shrink-0 text-[10px]" />
                        <div className="min-w-0">
                          <div className="max-w-48 truncate font-medium text-ink">
                            {seller.businessName ?? seller.name}
                          </div>
                          <div className="max-w-48 truncate text-xs text-muted-foreground">{seller.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-ink">{profile.regionsServed.join(', ')}</TableCell>
                    <TableCell className="py-3 text-ink">{profile.trustScore.toFixed(0)}</TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {profile.kycSubmittedAt
                        ? profile.kycSubmittedAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })
                        : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <SellerKycReview sellerName={seller.businessName ?? seller.name} profile={profile} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
