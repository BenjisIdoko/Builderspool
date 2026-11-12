import { BellIcon, WalletIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { getPriceAlertsForBuyer } from '@/lib/queries/priceAlerts';
import { getSavingsWalletForBuyer } from '@/lib/wallet';
import { getSetting } from '@/lib/settings';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { walletEntryTone, pillClass } from '@/lib/statusColors';
import { updateBuyerProfile, requestWithdrawalAction } from './actions';
import { cancelPriceAlert } from '../catalog/actions';
import { signOutBuyer as signOutBuyerAction } from '@/app/login/actions';
import { VerifyEmailBanner } from '@/components/verify-email-banner';
import { OrderHistoryList } from '@/components/order-history-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ActionForm } from '@/components/ui/action-form';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { PickupStationPicker } from '@/components/pickup-station-picker';
import { getPickupCenters } from '@/lib/queries/pickupCenters';

export const metadata = { title: 'Your account' };

// Orders shown here; the rest are one tap away on /orders.
const RECENT_ORDERS = 5;

const CARD = 'overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-hairline)]';
const CARD_PAD = 'rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-hairline)]';
const LINK = 'rounded-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring';

const WALLET_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  PAID: 'Paid out',
};

export default async function AccountPage() {
  const buyer = await requireBuyer();
  const [orders, priceAlerts, wallet, withdrawalsEnabled, pickupCenters] = await Promise.all([
    getOrdersForBuyer(buyer.id),
    getPriceAlertsForBuyer(buyer.id),
    getSavingsWalletForBuyer(buyer.id),
    getSetting<boolean>('money.walletWithdrawalsEnabled'),
    getPickupCenters(),
  ]);
  const activeOrders = orders.filter((o) => o.status !== 'CANCELLED').length;
  const recentOrders = orders.slice(0, RECENT_ORDERS);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-12">
      {!buyer.emailVerifiedAt && <VerifyEmailBanner />}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="mb-1 text-pretty text-ink">Welcome back, {buyer.name}</h1>
          <p className="text-sm text-slate">
            <Link href="/orders" className={LINK}>
              {activeOrders} active {activeOrders === 1 ? 'order' : 'orders'}
            </Link>
          </p>
        </div>
        <form action={signOutBuyerAction}>
          <Button type="submit" variant="outline" size="sm" className="max-sm:h-11">
            Log out
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-8">
        <section aria-labelledby="orders-heading" className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4">
            <h2 id="orders-heading" className="text-heading-sm text-ink">
              Recent orders
            </h2>
            {orders.length > RECENT_ORDERS && (
              <Link href="/orders" className={`text-sm ${LINK}`}>
                View all <span className="tabular-nums">{orders.length}</span> orders
              </Link>
            )}
          </div>
          <OrderHistoryList orders={recentOrders} />
        </section>

        <section aria-labelledby="savings-heading" className={CARD}>
          <div className="border-b border-border px-5 py-4">
            <h2 id="savings-heading" className="flex items-center gap-1.5 text-heading-sm text-ink">
              <WalletIcon aria-hidden className="size-4" />
              Savings credit
            </h2>
            <p className="mt-1 max-w-[64ch] text-pretty text-sm text-muted-foreground">
              Your share of every saving on your orders. It&apos;s added here once we&apos;ve received and checked your order.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-4 border-b border-border p-5 sm:grid-cols-3">
            <div>
              <dt className="text-caption text-muted-foreground">{withdrawalsEnabled ? 'Available' : 'Savings credit'}</dt>
              <dd className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.available)}</dd>
            </div>
            {withdrawalsEnabled ? (
              <>
                <div>
                  <dt className="text-caption text-muted-foreground">Withdrawal requested</dt>
                  <dd className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.withdrawalRequested)}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">Paid out so far</dt>
                  <dd className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.paidOut)}</dd>
                </div>
              </>
            ) : (
              <dd className="self-end text-pretty text-sm text-muted-foreground sm:col-span-2">
                Withdrawals aren&apos;t available yet. Your credit stays on your account.
              </dd>
            )}
          </dl>
          {withdrawalsEnabled && wallet.available > 0 && (
            <div className="border-b border-border px-5 py-4">
              <ActionForm
                action={requestWithdrawalAction}
                successMessage="Withdrawal requested."
                confirm={{
                  title: `Request a withdrawal of ${formatNaira(wallet.available)}?`,
                  description: 'Your available credit moves to “Withdrawal requested” until our team pays it out.',
                  confirmLabel: 'Request withdrawal',
                }}
              >
                <Button type="submit" className="max-sm:w-full">
                  Request withdrawal of {formatNaira(wallet.available)}
                </Button>
              </ActionForm>
            </div>
          )}
          {wallet.entries.length === 0 ? (
            <p className="max-w-[64ch] text-pretty p-5 text-sm text-muted-foreground">
              No savings yet. Savings are added once an order you place is fulfilled for less than the price you paid.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {wallet.entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="text-pretty text-sm font-semibold text-ink">
                      {entry.allocation?.bid.material.name ?? entry.sheetFulfilment?.orderItem.material.name}
                    </div>
                    <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      You paid {formatNaira(Number(entry.referenceValue))}, actual cost {formatNaira(Number(entry.actualValue))} · {formatLagosDate(entry.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-bold tabular-nums text-ink">+{formatNaira(Number(entry.buyerShare))}</span>
                    <Badge variant="outline" className={pillClass(walletEntryTone(entry.state))}>
                      {WALLET_LABEL[entry.state]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="pickup" aria-labelledby="pickup-heading" className={`scroll-mt-24 ${CARD_PAD}`}>
          <h2 id="pickup-heading" className="text-heading-sm text-ink">
            Pickup station
          </h2>
          <p className="mb-4 mt-1 max-w-[64ch] text-pretty text-sm text-muted-foreground">
            Choose where you collect your orders. Checkout uses it whenever you pick Pickup, and you can still change it for a single order.
          </p>
          <PickupStationPicker centers={pickupCenters} savedId={buyer.pickupCenterId} />
        </section>

        <section aria-labelledby="profile-heading" className={CARD_PAD}>
          <h2 id="profile-heading" className="mb-4 text-heading-sm text-ink">
            Profile
          </h2>
          <ActionForm action={updateBuyerProfile} successMessage="Saved." className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={buyer.email} disabled />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required autoComplete="name" defaultValue={buyer.name} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={buyer.phone ?? ''} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" name="businessName" autoComplete="organization" defaultValue={buyer.businessName ?? ''} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Job site or delivery location</Label>
              <Input id="location" name="location" autoComplete="street-address" defaultValue={buyer.location ?? ''} />
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button type="submit">Save changes</Button>
            </div>
          </ActionForm>
        </section>

        <section aria-labelledby="alerts-heading" className={CARD}>
          <div className="border-b border-border px-5 py-4">
            <h2 id="alerts-heading" className="flex items-center gap-1.5 text-heading-sm text-ink">
              <BellIcon aria-hidden className="size-4" />
              Price alerts
            </h2>
          </div>
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
      </div>
    </div>
  );
}
