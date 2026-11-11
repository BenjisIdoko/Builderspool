import { BellIcon, WalletIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { getPriceAlertsForBuyer } from '@/lib/queries/priceAlerts';
import { getSavingsWalletForBuyer } from '@/lib/wallet';
import { getSetting } from '@/lib/settings';
import { formatNaira } from '@/lib/format';
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

export const metadata = { title: 'Your account' };

const WALLET_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  PAID: 'Paid out',
};

export default async function AccountPage() {
  const buyer = await requireBuyer();
  const [orders, priceAlerts, wallet, withdrawalsEnabled] = await Promise.all([
    getOrdersForBuyer(buyer.id),
    getPriceAlertsForBuyer(buyer.id),
    getSavingsWalletForBuyer(buyer.id),
    getSetting<boolean>('money.walletWithdrawalsEnabled'),
  ]);
  const activeOrders = orders.filter((o) => o.status !== 'CANCELLED').length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-10">
      {!buyer.emailVerifiedAt && <VerifyEmailBanner />}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-ink">Welcome back, {buyer.name}</h1>
          <p className="text-sm text-slate">
            {activeOrders} active {activeOrders === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <form action={signOutBuyerAction}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>

      <div className="mb-8 overflow-hidden rounded-lg bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-1.5 text-heading-sm text-ink">
            <WalletIcon className="size-4" />
            Savings credit
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your share of every real saving between what you paid and what a material actually cost to
            procure — credited here once we receive and check your order at our fulfilment centre.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 border-b border-border p-5 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">{withdrawalsEnabled ? 'Available' : 'Savings credit'}</div>
            <div className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.available)}</div>
          </div>
          {withdrawalsEnabled ? (
            <>
              <div>
                <div className="text-xs text-muted-foreground">Withdrawal requested</div>
                <div className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.withdrawalRequested)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Paid out all-time</div>
                <div className="text-xl font-bold tabular-nums text-ink">{formatNaira(wallet.paidOut)}</div>
              </div>
            </>
          ) : (
            <p className="self-end text-xs text-muted-foreground sm:col-span-2">
              Withdrawals aren&apos;t available yet. Your credit is recorded and stays on your account.
            </p>
          )}
        </div>
        {withdrawalsEnabled && wallet.available > 0 && (
          <div className="border-b border-border px-5 py-4">
            <form action={requestWithdrawalAction}>
              <Button type="submit" size="sm">
                Request withdrawal of {formatNaira(wallet.available)}
              </Button>
            </form>
          </div>
        )}
        {wallet.entries.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No savings yet — real savings are credited once an order you place is fulfilled at a lower cost
            than the catalogue price.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {wallet.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">
                    {entry.allocation?.bid.material.name ?? entry.sheetFulfilment?.orderItem.material.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatNaira(Number(entry.referenceValue))} paid → {formatNaira(Number(entry.actualValue))}{' '}
                    actual cost · {entry.createdAt.toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-bold tabular-nums text-ink">+{formatNaira(Number(entry.buyerShare))}</span>
                  <Badge variant="outline" className={pillClass(walletEntryTone(entry.state))}>
                    {WALLET_LABEL[entry.state]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 rounded-lg bg-surface p-5">
        <h2 className="mb-4 text-heading-sm text-ink">Profile</h2>
        <form action={updateBuyerProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={buyer.email} disabled />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={buyer.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={buyer.phone ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={buyer.businessName ?? ''} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Job site / delivery location</Label>
            <Input id="location" name="location" defaultValue={buyer.location ?? ''} />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-heading-sm text-ink">Order history</h2>
        </div>
        <OrderHistoryList orders={orders} />
      </div>

      <div className="mt-8 overflow-hidden rounded-lg bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-1.5 text-heading-sm text-ink">
            <BellIcon className="size-4" />
            Price alerts
          </h2>
        </div>
        {priceAlerts.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No price alerts yet — set one from a material&apos;s technical specs panel.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {priceAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <Link href={`/catalog/${alert.material.id}`} className="text-sm font-semibold text-ink hover:underline">
                    {alert.material.name}
                  </Link>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Target {formatNaira(alert.targetPrice)} · currently {formatNaira(alert.material.catalogPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {alert.reached ? (
                    <Badge variant="outline" className="bg-success-soft text-success border-transparent">
                      Target reached
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border text-slate">
                      Watching
                    </Badge>
                  )}
                  <form action={cancelPriceAlert.bind(null, alert.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
