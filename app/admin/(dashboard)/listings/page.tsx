import { getReviewQueue } from '@/lib/queries/listingReview';
import { ListingReviewView } from '@/components/admin/listing-review-view';

export const metadata = { title: 'Listing review' };

export default async function AdminListingReviewPage() {
  const { pending, decided, all } = await getReviewQueue();
  return <ListingReviewView pending={pending} decided={decided} all={all} />;
}
