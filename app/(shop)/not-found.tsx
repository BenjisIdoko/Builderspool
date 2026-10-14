import Link from 'next/link';
import { EmptyState } from '@/components/empty-state/empty-state';
import { NotFoundIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

// Shown for any missing storefront page — including a product that is no
// longer available — inside the normal header, tab bar and footer, so the
// buyer is one tap from the catalogue instead of stranded.
export default function ShopNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pt-28 pb-24">
      <EmptyState
        illustration={NotFoundIllustration}
        as="h1"
        title="We couldn't find that page"
        description="The link may be old, or the product is no longer available. Browse the catalogue to find what you need."
      >
        <Button asChild>
          <Link href="/catalog">Browse the catalogue</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
