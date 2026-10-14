import Link from 'next/link';
import { EmptyState } from '@/components/empty-state/empty-state';
import { NotFoundIllustration } from '@/components/empty-state/illustrations';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

// Root 404 for everything outside the storefront (seller, admin, unknown paths).
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6">
      <EmptyState
        illustration={NotFoundIllustration}
        as="h1"
        title="We couldn't find that page"
        description="The link may be old or mistyped."
      >
        <Button asChild>
          <Link href="/">Back to Builders Pool</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
