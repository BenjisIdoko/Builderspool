import Link from 'next/link';
import { getSellerIdFromSession } from '@/lib/seller/session';
import { getSellerAllocations } from '@/lib/queries/sellerPortal';
import { EmptyState } from '@/components/empty-state/empty-state';
import { EmptyListIllustration } from '@/components/empty-state/illustrations';
import { SellerAllocationList } from '@/components/seller/allocation-list';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Allocations' };

export default async function SellerAllocationsPage() {
  const sellerId = (await getSellerIdFromSession())!;
  const allocations = await getSellerAllocations(sellerId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <div className="mb-1 text-xs text-muted-foreground">Merchant · awards</div>
      <h1 className="mb-1 text-heading-lg text-ink">Allocations</h1>
      <p className="mb-6 max-w-[64ch] text-pretty text-sm text-muted-foreground">
        Materials awarded to you. Accept each award before its deadline, or it passes to the next supplier. After you accept, deliver to the
        fulfilment centre shown. We confirm receipt, then pay you.
      </p>

      {allocations.length === 0 ? (
        <div className="rounded-lg bg-card-alt">
          <EmptyState
            illustration={EmptyListIllustration}
            variant="inline"
            as="p"
            title="Nothing awarded to you yet"
            description="Awards appear here when one of your bids or RFQ prices wins."
          >
            <Button asChild variant="outline">
              <Link href="/seller/rfqs">Open RFQs</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <SellerAllocationList allocations={allocations} />
      )}
    </div>
  );
}
