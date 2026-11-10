import Link from 'next/link';
import { CaretLeftIcon } from '@phosphor-icons/react/ssr';
import { requireBuyer } from '@/lib/buyer/auth';
import { CheckoutForm } from './checkout-form';
import { CheckoutSteps } from '@/components/checkout-steps';
import { getBuyerFacingTimes } from '@/lib/bidding/buyerTimes';
import { addDaysYmd, lagosYmd } from '@/lib/bidding/schedule';
import { isPoolClosedForToday } from '@/lib/pool-stages';
import { getCheckoutAreas } from '@/lib/queries/checkoutAreas';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const buyer = await requireBuyer();
  const [{ times }, areas, centerRows] = await Promise.all([
    getBuyerFacingTimes(),
    getCheckoutAreas(),
    prisma.fulfillmentCenter.findMany({ select: { region: true, name: true, address: true }, orderBy: { createdAt: 'asc' } }),
  ]);
  // Where pickup happens, by region: the first centre in each region.
  const centers: Record<string, { name: string; address: string }> = {};
  for (const c of centerRows) centers[c.region] ??= { name: c.name, address: c.address };

  return (
    <div className="mx-auto w-full max-w-section pt-6 pb-10">
      <Link
        href="/cart"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-ink"
      >
        <CaretLeftIcon className="size-3.5" />
        Back to cart
      </Link>
      <CheckoutSteps current={1} />
      <h1 className="mb-2 text-ink">Checkout</h1>
      <p className="mb-8 text-body-sm text-muted-foreground">
        Ordering as {buyer.name} ({buyer.email}).
      </p>
      <CheckoutForm
        defaultContactName={buyer.businessName ?? buyer.name}
        defaultContactPhone={buyer.phone ?? ''}
        // True only when the configured Paystack key is a test key, so the
        // TEST tag can never appear on (or be missing from) a live payment.
        areas={areas}
        centers={centers}
        poolDay={isPoolClosedForToday(times) ? 'tomorrow' : 'today'}
        poolCloseTime={times.poolCloseTime}
        // Earliest on-site date a buyer can ask for: tomorrow, Lagos time.
        earliestDate={addDaysYmd(lagosYmd(new Date()), 1)}
        testMode={process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ?? false}
      />
    </div>
  );
}
