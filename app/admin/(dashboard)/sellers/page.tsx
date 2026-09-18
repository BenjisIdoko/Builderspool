import { StorefrontIcon, SealCheckIcon, ClockIcon } from '@phosphor-icons/react/ssr';
import { getSellerDirectory, getSellerDirectoryCounts } from '@/lib/queries/adminSellers';
import { KpiCard } from '@/components/kpi-card';
import { SellerDirectoryTable } from '@/components/admin/seller-directory-table';

export default async function AdminSellersPage() {
  const sellers = await getSellerDirectory();
  const counts = await getSellerDirectoryCounts(sellers);

  const kpiCards = [
    { label: 'Total sellers', value: String(counts.total), icon: StorefrontIcon, tone: 'info' as const, chip: 'Registered' },
    { label: 'Verified', value: String(counts.verified), icon: SealCheckIcon, tone: 'success' as const, chip: 'KYC approved' },
    {
      label: 'Pending verification',
      value: String(counts.pending),
      icon: ClockIcon,
      tone: counts.pending > 0 ? ('warning' as const) : ('success' as const),
      chip: counts.pending > 0 ? 'Needs review' : 'All clear',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-1 text-xs text-muted-foreground">Admin · merchant governance</div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink">Seller directory & verification</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every real seller account — KYC status, real GMV month-to-date, and real fulfillment rate from
        actual allocations.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} size="compact" />
        ))}
      </div>

      <SellerDirectoryTable sellers={sellers} />
    </div>
  );
}
