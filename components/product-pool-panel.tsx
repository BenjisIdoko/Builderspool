import { UsersThreeIcon } from '@phosphor-icons/react/ssr';
import type { PoolSnapshot } from '@/lib/queries/pool';
import { refundRuleText, SAVINGS_TIMING_TEXT } from '@/lib/pool-stages';

// The Pool & Save panel on a product page. It states, truthfully for this
// platform's flow, what happens to an order: the buyer pays the catalogue
// price now, the order joins the daily pool, suppliers bid blind, and half of
// any verified saving goes to the buyer's savings wallet once delivery is
// confirmed. Numbers shown are real aggregates; nothing is estimated here.
export function ProductPoolPanel({ pool, unit }: { pool: PoolSnapshot; unit: string }) {
  const day = pool.tomorrow ? 'tomorrow' : 'today';
  const empty = pool.pooledQuantity === 0;

  return (
    <section
      aria-label="Pool & Save"
      className="rounded-card border-l-4 border-cyan bg-pale-blue p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan px-3 py-1 text-caption font-bold text-ink">
          <UsersThreeIcon weight="fill" className="size-4" />
          Pool &amp; Save
        </span>
        <span className="text-body-sm text-slate">
          {pool.tomorrow ? 'Tomorrow’s pool' : 'Today’s pool'} closes{' '}
          <span className="font-mono text-figure text-ink">{pool.poolCloseTime}</span>
        </span>
      </div>

      <p className="mt-3 text-body-sm text-ink">
        You pay the catalogue price now. Orders placed before {pool.poolCloseTime} join {day}’s pool, and verified
        suppliers bid blind for the whole pool.
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-label text-slate uppercase">Pooled for {day}{pool.sheets && ' · all areas'}</dt>
          <dd className="mt-1 text-body-sm text-ink">
            {empty ? (
              'No orders yet — yours would open it.'
            ) : (
              <>
                <span className="font-mono text-figure tabular-nums">{pool.pooledQuantity.toLocaleString('en-NG')}</span>{' '}
                {unit} · <span className="font-mono text-figure tabular-nums">{pool.buyerCount}</span>{' '}
                {pool.buyerCount === 1 ? 'buyer' : 'buyers'}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-label text-slate uppercase">Your share of any saving</dt>
          <dd className="mt-1 text-body-sm text-ink">
            <span className="font-mono text-figure">50%</span> of the verified saving, paid to your savings wallet {SAVINGS_TIMING_TEXT}.
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-caption text-slate">
        {refundRuleText()}
      </p>
    </section>
  );
}
