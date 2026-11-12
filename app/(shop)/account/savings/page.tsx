import { WalletIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { getSavingsWalletForBuyer } from '@/lib/wallet';
import { getSetting } from '@/lib/settings';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { walletEntryTone, pillClass } from '@/lib/statusColors';
import { AccountShell, ACCOUNT_CARD } from '@/components/account-shell';
import { ActionForm } from '@/components/ui/action-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requestWithdrawalAction } from '../actions';

export const metadata = { title: 'Savings credit' };

const WALLET_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  WITHDRAWAL_REQUESTED: 'Withdrawal requested',
  PAID: 'Paid out',
};

export default async function AccountSavingsPage() {
  const buyer = await requireBuyer();
  const [wallet, withdrawalsEnabled] = await Promise.all([getSavingsWalletForBuyer(buyer.id), getSetting<boolean>('money.walletWithdrawalsEnabled')]);

  return (
    <AccountShell>
      <h1 className="mb-2 flex items-center gap-2 text-ink">
        <WalletIcon aria-hidden className="size-7 shrink-0" />
        Savings credit
      </h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Your share of every saving on your orders. It&apos;s added here once we&apos;ve received and checked your order.
      </p>

      <section aria-label="Your savings credit" className={ACCOUNT_CARD}>
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
            <dd className="self-end text-pretty text-sm text-muted-foreground sm:col-span-2">Withdrawals aren&apos;t available yet. Your credit stays on your account.</dd>
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
    </AccountShell>
  );
}
