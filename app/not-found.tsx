import Link from 'next/link';
import { LogoMark } from '@/components/logo';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

// Root 404 for everything outside the storefront (seller, admin, unknown paths).
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark className="size-12" />
      <div>
        <h1 className="mb-1 text-xl font-bold tracking-tight text-ink">We couldn&apos;t find that page</h1>
        <p className="text-sm text-muted-foreground">The link may be old or mistyped.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to Builders Pool</Link>
      </Button>
    </div>
  );
}
