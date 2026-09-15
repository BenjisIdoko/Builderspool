import Link from 'next/link';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { getDemoBuyer } from '@/lib/demoBuyer';
import { CheckoutForm } from './checkout-form';

export default async function CheckoutPage() {
  const buyer = await getDemoBuyer();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link
        href="/cart"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-ink"
      >
        <CaretLeftIcon className="size-3.5" />
        Back to cart
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Checkout</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ordering as {buyer.name} ({buyer.email}) — buyer accounts aren&apos;t built yet, so every
        checkout uses this demo account for now.
      </p>
      <CheckoutForm buyerId={buyer.id} />
    </div>
  );
}
