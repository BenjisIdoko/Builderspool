import Link from 'next/link';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerBids } from '@/lib/queries/sellerPortal';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { SellerBidList } from '@/components/seller/bid-list';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'My bids' };

export default async function SellerBidsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const bids = await getSellerBids(sellerId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20 [&>*]:max-w-5xl">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · bidding</div>
      <h1 className="mb-1 text-heading-lg text-ink">My bids</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Every bid you&apos;ve submitted. You can withdraw one while its pool is still open. To bid on a whole category at once, open{' '}
        <Link href="/seller/rfqs" className="rounded-sm font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
          RFQs
        </Link>
        .
      </p>

      {bids.length === 0 ? (
        <div className="rounded-lg bg-card-alt">
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="No bids yet"
            description="Bids you submit on open pools and RFQs appear here."
          >
            <Button asChild variant="outline">
              <Link href="/seller/rfqs">Open RFQs</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <SellerBidList bids={bids} />
      )}
    </div>
  );
}
