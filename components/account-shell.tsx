import { AccountNav } from '@/components/account-nav';

export const ACCOUNT_CARD = 'overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-hairline)]';
export const ACCOUNT_CARD_PAD = 'rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-hairline)]';
export const ACCOUNT_LINK = 'rounded-sm font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring';

// The frame around every account page: the menu beside (or above) the page's own content.
export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-12">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
