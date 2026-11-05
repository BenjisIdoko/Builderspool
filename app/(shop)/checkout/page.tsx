import Link from 'next/link';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { CheckoutForm } from './checkout-form';
import { CheckoutSteps } from '@/components/checkout-steps';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const buyer = await requireBuyer();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-6 pb-10">
      <Link
        href="/cart"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-ink"
      >
        <CaretLeftIcon className="size-3.5" />
        Back to cart
      </Link>
      <CheckoutSteps current={1} />
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-ink">Checkout</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ordering as {buyer.name} ({buyer.email}).
      </p>
      <CheckoutForm
        defaultContactName={buyer.businessName ?? buyer.name}
        defaultContactPhone={buyer.phone ?? ''}
        // True only when the configured Paystack key is a test key, so the
        // TEST tag can never appear on (or be missing from) a live payment.
        testMode={process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ?? false}
      />
    </div>
  );
}
