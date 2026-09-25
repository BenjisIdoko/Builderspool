import Link from 'next/link';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

// Shown for any missing storefront page — including a product that is no
// longer available — inside the normal header, tab bar and footer, so the
// buyer is one tap from the catalogue instead of stranded.
export default function ShopNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 pt-28 pb-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <MagnifyingGlassIcon className="size-6" />
      </span>
      <div>
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">We couldn&apos;t find that page</h1>
        <p className="text-sm text-muted-foreground">
          The link may be old, or the product is no longer available. Browse the catalogue to find what you need.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/catalog">Browse the catalogue</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
