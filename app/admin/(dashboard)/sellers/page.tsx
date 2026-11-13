import { StorefrontIcon, SealCheckIcon, ClockIcon } from '@phosphor-icons/react/ssr';
import { getSellerDirectory, getSellerDirectoryCounts } from '@/lib/queries/adminSellers';
import { KpiCard } from '@/components/kpi-card';
import { SellerDirectoryTable } from '@/components/admin/seller-directory-table';

export const metadata = { title: 'Sellers' };

export default async function AdminSellersPage() {
  const sellers = await getSellerDirectory();
  const counts = await getSellerDirectoryCounts(sellers);

  const kpiCards = [
    { label: 'Total sellers', value: String(counts.total), icon: StorefrontIcon, tone: 'info' as const, chip: 'Registered' },
    { label: 'Verified', value: String(counts.verified), icon: SealCheckIcon, tone: 'success' as const, chip: 'Verification approved' },
    {
      label: 'Waiting for review',
      value: String(counts.pending),
      icon: ClockIcon,
      tone: counts.pending > 0 ? ('warning' as const) : ('success' as const),
      chip: counts.pending > 0 ? 'Needs review' : 'All clear',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · merchant governance</div>
      <h1 className="mb-1 text-heading-lg text-ink">Sellers</h1>
      <p className="mb-8 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Every seller account with its verification status, sales this month and how much of what was awarded it delivered.
      </p>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <SellerDirectoryTable sellers={sellers} />
    </div>
  );
}
