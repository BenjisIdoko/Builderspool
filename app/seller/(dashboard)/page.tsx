import { ClockIcon, MapPinIcon, TrophyIcon, CheckCircleIcon } from '@phosphor-icons/react/ssr';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerProfile, getOpenCyclesForSeller } from '@/lib/queries/sellerPortal';
import { formatNaira } from '@/lib/format';
import { BidDialog } from '@/components/seller/bid-dialog';

export default async function SellerDashboardPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const [profile, cycles] = await Promise.all([
    getSellerProfile(sellerId),
    getOpenCyclesForSeller(sellerId),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <div>
          <div className="text-sm font-bold text-ink">{profile!.user.businessName ?? profile!.user.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-4" />
            Serves {profile!.regionsServed.join(', ')}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-well px-3.5 py-2">
          <TrophyIcon className="size-4 text-brand" />
          <span className="text-sm text-slate">Trust score</span>
          <span className="text-sm font-bold text-ink">{profile!.trustScore}</span>
        </div>
      </div>

      <div className="mb-1 text-xs text-muted-foreground">Seller portal</div>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">Open demand pools</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Blind bidding — you&apos;ll never see other sellers&apos; bids or buyer identities, only the
        aggregated demand.
      </p>

      {cycles.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
          <ClockIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No open cycles match your regions right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="border-t border-r border-border p-6">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate">
                  {cycle.region ?? 'National'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ClockIcon className="size-3" />
                  {cycle.cutoffAt.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div className="mb-0.5 text-[15px] font-bold text-ink">{cycle.material.name}</div>
              <div className="mb-3.5 text-xs text-muted-foreground">{cycle.material.category}</div>
              {cycle.material.spec && (
                <div className="mb-4 text-[12.5px] leading-relaxed text-slate">{cycle.material.spec}</div>
              )}

              <div className="mb-1 flex justify-between text-[13px]">
                <span className="text-slate">Pooled demand</span>
                <span className="font-semibold text-ink">
                  {cycle.totalQuantityRequested} {cycle.material.unit}
                </span>
              </div>

              {cycle.myBid && (
                <div className="mt-3 flex items-start gap-1.5 rounded-md bg-well px-3 py-2.5 text-[12.5px] text-ink">
                  <CheckCircleIcon className="mt-0.5 size-3.5 shrink-0 text-brand" />
                  <span>
                    Your bid: <span className="font-bold">{formatNaira(cycle.myBid.unitPrice)}</span> for{' '}
                    <span className="font-bold">
                      {cycle.myBid.quantityOffered} {cycle.material.unit}
                    </span>
                  </span>
                </div>
              )}

              <div className="mt-4">
                <BidDialog sellerId={sellerId} cycle={cycle} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
