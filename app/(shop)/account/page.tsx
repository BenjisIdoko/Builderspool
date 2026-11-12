import Link from 'next/link';
import { requireBuyer } from '@/lib/buyer/auth';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { getPriceAlertsForBuyer } from '@/lib/queries/priceAlerts';
import { getSavingsWalletForBuyer } from '@/lib/wallet';
import { getPickupCenters } from '@/lib/queries/pickupCenters';
import { formatNaira } from '@/lib/format';
import { AccountShell, ACCOUNT_CARD, ACCOUNT_LINK } from '@/components/account-shell';
import { OrderHistoryList } from '@/components/order-history-list';
import { VerifyEmailBanner } from '@/components/verify-email-banner';
import { Button } from '@/components/ui/button';
import { signOutBuyer as signOutBuyerAction } from '@/app/login/actions';

export const metadata = { title: 'Your account' };

// Orders shown on the overview; the rest are one tap away on /orders.
const RECENT_ORDERS = 5;

function OverviewCard({ id, title, href, action, children }: { id: string; title: string; href: string; action: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={`flex flex-col ${ACCOUNT_CARD}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 id={id} className="text-label text-ink uppercase">
          {title}
        </h2>
        <Link href={href} className={`inline-flex min-h-11 items-center text-sm ${ACCOUNT_LINK}`}>
          {action}
        </Link>
      </div>
      <div className="flex-1 px-5 py-4">{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const buyer = await requireBuyer();
  const [orders, priceAlerts, wallet, pickupCenters] = await Promise.all([
    getOrdersForBuyer(buyer.id),
    getPriceAlertsForBuyer(buyer.id),
    getSavingsWalletForBuyer(buyer.id),
    getPickupCenters(),
  ]);
  const activeOrders = orders.filter((o) => o.status !== 'CANCELLED').length;
  const station = pickupCenters.find((c) => c.id === buyer.pickupCenterId) ?? null;
  const reached = priceAlerts.filter((a) => a.reached).length;

  return (
    <AccountShell>
      {!buyer.emailVerifiedAt && <VerifyEmailBanner />}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="mb-1 text-pretty text-ink">Welcome back, {buyer.name}</h1>
          <p className="text-sm text-slate">
            <Link href="/orders" className={ACCOUNT_LINK}>
              {activeOrders} active {activeOrders === 1 ? 'order' : 'orders'}
            </Link>
          </p>
        </div>
        <form action={signOutBuyerAction} className="lg:hidden">
          <Button type="submit" variant="outline" size="sm" className="max-sm:h-11">
            Log out
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <OverviewCard id="details-heading" title="Account details" href="/account/profile" action="Edit">
          <div className="text-pretty font-semibold text-ink">{buyer.name}</div>
          <div className="break-words text-sm text-muted-foreground">{buyer.email}</div>
          {buyer.phone && <div className="mt-2 text-sm text-muted-foreground">{buyer.phone}</div>}
          {buyer.businessName && <div className="text-sm text-muted-foreground">{buyer.businessName}</div>}
          {buyer.location && <div className="text-sm text-muted-foreground">{buyer.location}</div>}
        </OverviewCard>

        <OverviewCard id="pickup-heading" title="Pickup station" href="/account/pickup" action={station ? 'Change' : 'Choose'}>
          {station ? (
            <>
              <div className="text-pretty font-semibold text-ink">{station.name}</div>
              <div className="text-pretty text-sm text-muted-foreground">{station.address}</div>
            </>
          ) : (
            <p className="max-w-[40ch] text-pretty text-sm text-muted-foreground">Not chosen yet. We use the default station for your region until you pick one.</p>
          )}
        </OverviewCard>

        <OverviewCard id="savings-heading" title="Savings credit" href="/account/savings" action="Details">
          <div className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.available)}</div>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">Your share of the savings on your orders.</p>
        </OverviewCard>

        <OverviewCard id="alerts-heading" title="Price alerts" href="/account/alerts" action="Manage">
          {priceAlerts.length === 0 ? (
            <p className="text-pretty text-sm text-muted-foreground">No alerts yet. Set a target price on any material.</p>
          ) : (
            <>
              <div className="text-xl font-bold tabular-nums text-ink">{priceAlerts.length}</div>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {reached} {reached === 1 ? 'target' : 'targets'} reached
              </p>
            </>
          )}
        </OverviewCard>
      </div>

      <section aria-labelledby="orders-heading" className={`mt-4 ${ACCOUNT_CARD}`}>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 id="orders-heading" className="text-label text-ink uppercase">
            Recent orders
          </h2>
          {orders.length > RECENT_ORDERS && (
            <Link href="/orders" className={`inline-flex min-h-11 items-center text-sm ${ACCOUNT_LINK}`}>
              View all <span className="ml-1 tabular-nums">{orders.length}</span>
            </Link>
          )}
        </div>
        <OrderHistoryList orders={orders.slice(0, RECENT_ORDERS)} />
      </section>
    </AccountShell>
  );
}
