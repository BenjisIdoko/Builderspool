import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerRfqs } from '@/lib/queries/sheets';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { SellerRfqList } from '@/components/seller/rfq-list';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'RFQs' };

const LINK = 'rounded-sm font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring';

export default async function SellerRfqsPage() {
  const sellerId = await getSellerIdFromSession();
  if (!sellerId) redirect('/seller/login');
  const rfqs = await getSellerRfqs(sellerId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-5xl">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · bidding</div>
      <h1 className="mb-1 text-heading-lg text-ink">RFQs</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Each request is one category in one delivery zone, with every item the pool ordered that day. Price every item and send one bid. Bids on a single
        product are on{' '}
        <Link href="/seller/bids" className={LINK}>
          My bids
        </Link>
        .
      </p>

      {rfqs.length === 0 ? (
        <div className="rounded-lg bg-card-alt">
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="No requests right now"
            description="You get requests for the categories and delivery zones BuildersPool has approved for you. Ask for more in Settings."
          >
            <Button asChild variant="outline">
              <Link href="/seller/settings">Open Settings</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <SellerRfqList rfqs={rfqs} />
      )}
    </div>
  );
}
