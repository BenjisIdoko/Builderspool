import Link from 'next/link';
import { BellIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { getPriceAlertsForBuyer } from '@/lib/queries/priceAlerts';
import { formatNaira } from '@/lib/format';
import { AccountShell, ACCOUNT_CARD } from '@/components/account-shell';
import { ActionForm } from '@/components/ui/action-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { cancelPriceAlert } from '../../catalog/actions';

export const metadata = { title: 'Price alerts' };

export default async function AccountAlertsPage() {
  const buyer = await requireBuyer();
  const priceAlerts = await getPriceAlertsForBuyer(buyer.id);

  return (
    <AccountShell>
      <h1 className="mb-2 flex items-center gap-2 text-ink">
        <BellIcon aria-hidden className="size-7 shrink-0" />
        Price alerts
      </h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">Set a target price on any material and we&apos;ll tell you when it&apos;s reached.</p>

      <section aria-label="Your price alerts" className={ACCOUNT_CARD}>
        {priceAlerts.length === 0 ? (
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="No price alerts yet"
            description="Open any material and set a target price. We'll tell you when it's reached."
          >
            <Button asChild variant="outline">
              <Link href="/catalog">Browse materials</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {priceAlerts.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1 basis-56">
                  <Link href={`/catalog/${alert.material.id}`} className="text-pretty text-sm font-semibold text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                    {alert.material.name}
                  </Link>
                  <div className="mt-1 text-sm tabular-nums text-muted-foreground">
                    Target {formatNaira(alert.targetPrice)} · now {formatNaira(alert.material.catalogPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {alert.reached ? (
                    <Badge variant="outline" className="border-transparent bg-success-soft text-success">
                      Target reached
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border text-slate">
                      Watching
                    </Badge>
                  )}
                  <ActionForm action={cancelPriceAlert.bind(null, alert.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="max-sm:h-11">
                      Cancel alert
                    </Button>
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AccountShell>
  );
}
