import { ListChecksIcon } from '@phosphor-icons/react/ssr';
import type { ReviewRow } from '@/lib/queries/listingReview';
import { QC_REASON_TEXT } from '@/lib/listings/qc';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { ListingReviewForm } from '@/components/admin/listing-review-form';

const reasonText: Record<string, string> = QC_REASON_TEXT;

function Facts({ row }: { row: ReviewRow }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-body-sm sm:grid-cols-4">
      <div>
        <dt className="text-label text-slate uppercase">Price per {row.unit}</dt>
        <dd className="font-mono text-figure tabular-nums text-ink">
          <Money amount={row.price} />
        </dd>
      </div>
      <div>
        <dt className="text-label text-slate uppercase">Other sellers&rsquo; median</dt>
        <dd className="font-mono text-figure tabular-nums text-ink">
          {row.median == null ? 'None yet' : <Money amount={row.median} />}
          {row.percentOfMedian != null && <span className="ml-1 font-sans text-caption text-slate">({row.percentOfMedian}%)</span>}
        </dd>
      </div>
      <div>
        <dt className="text-label text-slate uppercase">Stock · lead time</dt>
        <dd className="text-ink">
          <span className="font-mono tabular-nums">{row.stockQty.toLocaleString('en-NG')}</span> · {row.leadTimeDays}d
        </dd>
      </div>
      <div>
        <dt className="text-label text-slate uppercase">Seller KYC</dt>
        <dd className="text-ink">{row.sellerKyc === 'APPROVED' ? 'Verified' : 'Not verified'}</dd>
        {row.sellerKyc !== 'APPROVED' && (
          <p className="mt-1 max-w-48 text-pretty text-caption text-warning-text">
            Approving still keeps it hidden from buyers until this seller&rsquo;s KYC is approved.
          </p>
        )}
      </div>
    </dl>
  );
}

const STATUS: Record<ReviewRow['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' }> = {
  ACTIVE: { label: 'Live', variant: 'success' },
  PENDING_REVIEW: { label: 'Waiting for review', variant: 'warning' },
  DRAFT: { label: 'Draft (seller not verified)', variant: 'warning' },
  PAUSED: { label: 'Paused by seller', variant: 'secondary' },
  REJECTED: { label: 'Needs a fix', variant: 'danger' },
};

export function ListingReviewView({
  pending,
  decided,
  all,
}: {
  pending: ReviewRow[];
  decided: ReviewRow[];
  all: (ReviewRow & { category: string })[];
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Admin · commerce</div>
      <h1 className="mb-1 text-heading-lg text-ink">Listing review</h1>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Flagged listings wait for you here. Every listing, whatever its status, is under All listings.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard size="compact" label="Waiting for review" value={String(pending.length)} icon={ListChecksIcon} tone={pending.length > 0 ? 'warning' : 'success'} chip="" />
      </div>

      <section className="mb-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">Waiting for review ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing is waiting. Flagged listings will appear here.</p>
        ) : (
          <ul className="space-y-5">
            {pending.map((row) => (
              <li key={row.id} className="space-y-3 rounded-card bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-heading-sm text-ink">{row.material}</h3>
                  <span className="text-body-sm text-slate">{row.seller}</span>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {row.reasons.map((r) => (
                    <li key={r}>
                      <Badge variant="warning">{reasonText[r] ?? r}</Badge>
                    </li>
                  ))}
                </ul>
                <Facts row={row} />
                {row.photos.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {row.photos.map((p) => (
                      <li key={p.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" className="size-20 rounded-md bg-well object-cover" />
                      </li>
                    ))}
                  </ul>
                )}
                <ListingReviewForm listingId={row.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">Recently decided</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-muted-foreground">No decisions yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {decided.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-body-sm">
                <span className="text-ink">
                  {row.material} <span className="text-slate">· {row.seller}</span>
                </span>
                <span className="flex items-center gap-2">
                  {row.reviewNote && <span className="max-w-xs truncate text-caption text-slate">{row.reviewNote}</span>}
                  <Badge variant={row.status === 'REJECTED' ? 'danger' : 'success'}>{row.status === 'REJECTED' ? 'Rejected' : 'Approved'}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-card bg-card-alt p-5">
        <h2 className="mb-4 text-heading-md text-ink">All listings ({all.length})</h2>
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">No seller has listed a product yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {all.map((row) => (
              <li key={row.id} className="grid gap-1 py-3 text-body-sm sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{row.material}</div>
                  <div className="text-slate">
                    {row.category} · {row.seller} · <Money amount={row.price} /> / {row.unit} · stock {row.stockQty.toLocaleString('en-NG')} ·{' '}
                    {row.photos.length} {row.photos.length === 1 ? 'photo' : 'photos'}
                  </div>
                  {row.status === 'REJECTED' && row.reasons.length > 0 && (
                    <div className="text-danger">{row.reasons.map((r) => reasonText[r] ?? r).join(' ')}</div>
                  )}
                </div>
                <Badge variant={STATUS[row.status].variant} className="justify-self-start sm:justify-self-end">
                  {STATUS[row.status].label}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
